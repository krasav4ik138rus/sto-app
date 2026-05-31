import type { CreateAttachmentMetadataInput, ListAttachmentsQuery } from '@autoservice-app/contracts'
import { randomUUID } from 'node:crypto'

import type { DbClient } from '../db'
import { Prisma } from '../generated/prisma/client'
import { AppError } from '../http/errors'
import { requireCanReadWorkOrder } from './sto-access'
import type { StoContext } from './sto-context'
import { toOrderAttachmentDto } from './sto-mappers'
import {
  attachmentFileResponse,
  createAttachmentStorageKey,
  removeAttachmentFile,
  type AttachmentUploadFile,
  validateUploadFile,
  writeAttachmentFile,
} from './attachment-files'

const managerRoles = ['MASTER', 'DIRECTOR', 'ADMIN'] as const

type UploadAttachmentInput = Pick<
  CreateAttachmentMetadataInput,
  'caption' | 'diagnosticId' | 'inspectionActId' | 'recommendationId' | 'type' | 'visibility'
>

export class AttachmentsService {
  constructor(private readonly db: DbClient) {}

  async list(context: StoContext, workOrderId: string, query: ListAttachmentsQuery = {}) {
    await this.getWorkOrderForAccess(context, workOrderId)
    const limit = query.limit ?? 50
    const attachments = await this.db.orderAttachment.findMany({
      where: {
        workOrderId,
        deletedAt: null,
        ...(query.type ? { type: Array.isArray(query.type) ? { in: query.type } : query.type } : {}),
        ...(query.visibility ? { visibility: query.visibility } : {}),
        ...(query.search
          ? {
              OR: [
                { originalFilename: { contains: query.search } },
                { caption: { contains: query.search } },
                { storageKey: { contains: query.search } },
              ],
            }
          : {}),
      },
      orderBy: query.sort === 'created_asc' ? { createdAt: 'asc' } : { createdAt: 'desc' },
      take: limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })

    return {
      items: attachments.map(toOrderAttachmentDto),
      nextCursor: attachments.length === limit ? attachments.at(-1)?.id ?? null : null,
    }
  }

  async create(context: StoContext, workOrderId: string, input: CreateAttachmentMetadataInput) {
    const workOrder = await this.getWorkOrderForAccess(context, workOrderId)
    if (input.workOrderId && input.workOrderId !== workOrderId) {
      throw new AppError(400, 'BAD_REQUEST', 'Attachment workOrderId must match route work order')
    }
    await this.assertLinkedRecords(context, workOrderId, input)

    const attachment = await this.db.orderAttachment.create({
      data: {
        organizationId: workOrder.organizationId,
        workOrderId,
        inspectionActId: input.inspectionActId ?? null,
        diagnosticId: input.diagnosticId ?? null,
        recommendationId: input.recommendationId ?? null,
        type: input.type,
        visibility: input.visibility ?? 'INTERNAL',
        storageKey: input.storageKey,
        fileUrl: input.fileUrl ?? null,
        originalFilename: input.originalFilename ?? null,
        mimeType: input.mimeType ?? null,
        byteSize: input.byteSize ?? null,
        caption: input.caption ?? null,
        createdByStaffProfileId: context.staffProfile.id,
      },
    })

    await this.audit(context, attachment.id, 'attachment_created', input)
    return toOrderAttachmentDto(attachment)
  }

  async upload(context: StoContext, workOrderId: string, input: UploadAttachmentInput, file: AttachmentUploadFile) {
    const workOrder = await this.getWorkOrderForAccess(context, workOrderId)
    await this.assertLinkedRecords(context, workOrderId, input)
    validateUploadFile(file, input.type)

    const storageKey = createAttachmentStorageKey({
      organizationId: workOrder.organizationId,
      workOrderId,
      originalFilename: file.originalFilename,
    })
    await writeAttachmentFile(storageKey, file.bytes)
    const attachmentId = randomUUID()

    try {
      const attachment = await this.db.orderAttachment.create({
        data: {
          id: attachmentId,
          organizationId: workOrder.organizationId,
          workOrderId,
          inspectionActId: input.inspectionActId ?? null,
          diagnosticId: input.diagnosticId ?? null,
          recommendationId: input.recommendationId ?? null,
          type: input.type,
          visibility: input.visibility ?? 'INTERNAL',
          storageKey,
          fileUrl: `/api/sto/attachments/${attachmentId}/file`,
          originalFilename: file.originalFilename,
          mimeType: file.mimeType,
          byteSize: file.size,
          caption: input.caption ?? null,
          createdByStaffProfileId: context.staffProfile.id,
        },
      })

      await this.audit(context, attachment.id, 'attachment_uploaded', {
        ...input,
        byteSize: file.size,
        mimeType: file.mimeType,
        originalFilename: file.originalFilename,
        storageKey,
      })
      return toOrderAttachmentDto(attachment)
    } catch (error) {
      await removeAttachmentFile(storageKey)
      throw error
    }
  }

  async delete(context: StoContext, attachmentId: string) {
    const current = await this.db.orderAttachment.findUnique({
      where: { id: attachmentId },
      include: { workOrder: true },
    })
    if (!current || current.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Attachment not found')
    requireCanReadWorkOrder(context, current.workOrder)
    if (!isManager(context.role) && current.createdByStaffProfileId !== context.staffProfile.id) {
      throw new AppError(403, 'FORBIDDEN', 'You cannot delete this attachment')
    }

    await this.db.orderAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    })

    await this.audit(context, attachmentId, 'attachment_deleted', { attachmentId })
    return { ok: true as const }
  }

  async file(context: StoContext, attachmentId: string) {
    const attachment = await this.db.orderAttachment.findUnique({
      where: { id: attachmentId },
      include: { workOrder: true },
    })
    if (!attachment || attachment.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Attachment not found')
    requireCanReadWorkOrder(context, attachment.workOrder)

    return attachmentFileResponse({
      filename: attachment.originalFilename,
      mimeType: attachment.mimeType,
      storageKey: attachment.storageKey,
    })
  }

  private async getWorkOrderForAccess(context: StoContext, workOrderId: string) {
    const workOrder = await this.db.workOrder.findUnique({ where: { id: workOrderId } })
    if (!workOrder) throw new AppError(404, 'NOT_FOUND', 'Work order not found')
    requireCanReadWorkOrder(context, workOrder)
    return workOrder
  }

  private async assertLinkedRecords(
    context: StoContext,
    workOrderId: string,
    input: Pick<CreateAttachmentMetadataInput, 'inspectionActId' | 'diagnosticId' | 'recommendationId'>,
  ) {
    if (input.inspectionActId) {
      const inspectionAct = await this.db.inspectionAct.findUnique({
        where: { id: input.inspectionActId },
        select: { workOrderId: true, organizationId: true },
      })
      if (!inspectionAct) throw new AppError(404, 'NOT_FOUND', 'Inspection act not found')
      assertSameOrder(context, workOrderId, inspectionAct, 'Inspection act')
    }

    if (input.diagnosticId) {
      const diagnostic = await this.db.diagnostic.findUnique({
        where: { id: input.diagnosticId },
        select: { workOrderId: true, organizationId: true },
      })
      if (!diagnostic) throw new AppError(404, 'NOT_FOUND', 'Diagnostic not found')
      assertSameOrder(context, workOrderId, diagnostic, 'Diagnostic')
    }

    if (input.recommendationId) {
      const recommendation = await this.db.recommendation.findUnique({
        where: { id: input.recommendationId },
        select: { workOrderId: true, organizationId: true },
      })
      if (!recommendation) throw new AppError(404, 'NOT_FOUND', 'Recommendation not found')
      assertSameOrder(context, workOrderId, recommendation, 'Recommendation')
    }
  }

  private audit(context: StoContext, entityId: string, action: string, payload: unknown) {
    return this.db.auditLog.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        staffProfileId: context.staffProfile.id,
        entityType: 'order_attachment',
        entityId,
        action,
        payloadJson: toJsonPayload(payload),
      },
    })
  }
}

function assertSameOrder(
  context: StoContext,
  workOrderId: string,
  record: { workOrderId: string; organizationId: string },
  label: string,
) {
  if (record.workOrderId !== workOrderId || record.organizationId !== context.staffProfile.organizationId) {
    throw new AppError(400, 'BAD_REQUEST', `${label} belongs to another work order`)
  }
}

function isManager(role: StoContext['role']) {
  return managerRoles.some((candidate) => candidate === role)
}

function toJsonPayload(payload: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue
}
