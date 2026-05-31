import { diagnosticTemplateV1 } from '@autoservice-app/contracts'
import type {
  AttachmentContextSide,
  AttachmentContextType,
  CreateAttachmentMetadataInput,
  ListAttachmentsQuery,
} from '@autoservice-app/contracts'
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
  | 'caption'
  | 'contextFieldId'
  | 'contextLabel'
  | 'contextSectionId'
  | 'contextSide'
  | 'contextType'
  | 'diagnosticId'
  | 'inspectionActId'
  | 'recommendationId'
  | 'type'
  | 'visibility'
>

type AttachmentContextInput = Pick<
  CreateAttachmentMetadataInput,
  | 'contextFieldId'
  | 'contextLabel'
  | 'contextSectionId'
  | 'contextSide'
  | 'contextType'
  | 'diagnosticId'
  | 'inspectionActId'
  | 'recommendationId'
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
        ...(query.contextType ? { contextType: query.contextType } : {}),
        ...(query.diagnosticId ? { diagnosticId: query.diagnosticId } : {}),
        ...(query.inspectionActId ? { inspectionActId: query.inspectionActId } : {}),
        ...(query.recommendationId ? { recommendationId: query.recommendationId } : {}),
        ...(query.contextFieldId ? { contextFieldId: query.contextFieldId } : {}),
        ...(query.contextSide ? { contextSide: query.contextSide } : {}),
        ...(query.search
          ? {
              OR: [
                { originalFilename: { contains: query.search } },
                { caption: { contains: query.search } },
                { storageKey: { contains: query.search } },
                { contextLabel: { contains: query.search } },
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
    const attachmentContext = normalizeAttachmentContext(input)

    const attachment = await this.db.orderAttachment.create({
      data: {
        organizationId: workOrder.organizationId,
        workOrderId,
        inspectionActId: input.inspectionActId ?? null,
        diagnosticId: input.diagnosticId ?? null,
        recommendationId: input.recommendationId ?? null,
        type: input.type,
        visibility: input.visibility ?? 'INTERNAL',
        ...attachmentContext,
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
    const attachmentContext = normalizeAttachmentContext(input)
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
          ...attachmentContext,
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
        ...attachmentContext,
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

function normalizeAttachmentContext(input: AttachmentContextInput): {
  contextType: AttachmentContextType
  contextSectionId: string | null
  contextFieldId: string | null
  contextSide: AttachmentContextSide
  contextLabel: string | null
} {
  const contextType = input.contextType ?? inferContextType(input)
  const contextSide = input.contextSide ?? 'NONE'

  if (contextType === 'ORDER') {
    assertContextSide(contextSide, ['NONE'], 'ORDER attachments must use contextSide NONE')
    return {
      contextType,
      contextSectionId: input.contextSectionId ?? null,
      contextFieldId: input.contextFieldId ?? null,
      contextSide,
      contextLabel: input.contextLabel ?? null,
    }
  }

  if (contextType === 'INSPECTION_ACT') {
    if (!input.inspectionActId) {
      throw new AppError(400, 'BAD_REQUEST', 'INSPECTION_ACT attachments require inspectionActId')
    }
    assertContextSide(contextSide, ['NONE'], 'INSPECTION_ACT attachments must use contextSide NONE')
    return {
      contextType,
      contextSectionId: input.contextSectionId ?? null,
      contextFieldId: input.contextFieldId ?? null,
      contextSide,
      contextLabel: input.contextLabel ?? null,
    }
  }

  if (contextType === 'INSPECTION_FIELD') {
    if (!input.inspectionActId || !input.contextFieldId) {
      throw new AppError(400, 'BAD_REQUEST', 'INSPECTION_FIELD attachments require inspectionActId and contextFieldId')
    }
    assertContextSide(contextSide, ['NONE'], 'INSPECTION_FIELD attachments must use contextSide NONE')
    return {
      contextType,
      contextSectionId: input.contextSectionId ?? null,
      contextFieldId: input.contextFieldId,
      contextSide,
      contextLabel: input.contextLabel ?? input.contextFieldId,
    }
  }

  if (contextType === 'DIAGNOSTIC') {
    if (!input.diagnosticId) {
      throw new AppError(400, 'BAD_REQUEST', 'DIAGNOSTIC attachments require diagnosticId')
    }
    assertContextSide(contextSide, ['NONE'], 'DIAGNOSTIC attachments must use contextSide NONE')
    return {
      contextType,
      contextSectionId: input.contextSectionId ?? null,
      contextFieldId: input.contextFieldId ?? null,
      contextSide,
      contextLabel: input.contextLabel ?? null,
    }
  }

  if (contextType === 'DIAGNOSTIC_ITEM') {
    if (!input.diagnosticId || !input.contextFieldId) {
      throw new AppError(400, 'BAD_REQUEST', 'DIAGNOSTIC_ITEM attachments require diagnosticId and contextFieldId')
    }
    const item = findDiagnosticTemplateItem(input.contextFieldId)
    if (!item) {
      throw new AppError(400, 'BAD_REQUEST', `Unknown diagnostic item: ${input.contextFieldId}`)
    }
    if (item.side === 'both') {
      assertContextSide(contextSide, ['LEFT', 'RIGHT'], 'DIAGNOSTIC_ITEM attachments for side=both require LEFT or RIGHT')
    } else {
      assertContextSide(contextSide, ['NONE'], 'DIAGNOSTIC_ITEM attachments for side=none must use NONE')
    }

    return {
      contextType,
      contextSectionId: input.contextSectionId ?? item.category,
      contextFieldId: item.id,
      contextSide,
      contextLabel: input.contextLabel ?? diagnosticItemContextLabel(item.label, contextSide),
    }
  }

  if (!input.recommendationId) {
    throw new AppError(400, 'BAD_REQUEST', 'RECOMMENDATION attachments require recommendationId')
  }
  assertContextSide(contextSide, ['NONE'], 'RECOMMENDATION attachments must use contextSide NONE')
  return {
    contextType,
    contextSectionId: input.contextSectionId ?? null,
    contextFieldId: input.contextFieldId ?? null,
    contextSide,
    contextLabel: input.contextLabel ?? null,
  }
}

function inferContextType(input: AttachmentContextInput): AttachmentContextType {
  if (input.recommendationId) return 'RECOMMENDATION'
  if (input.contextFieldId && input.diagnosticId) return 'DIAGNOSTIC_ITEM'
  if (input.diagnosticId) return 'DIAGNOSTIC'
  if (input.contextFieldId && input.inspectionActId) return 'INSPECTION_FIELD'
  if (input.inspectionActId) return 'INSPECTION_ACT'
  return 'ORDER'
}

function findDiagnosticTemplateItem(fieldId: string) {
  for (const category of diagnosticTemplateV1.categories) {
    const item = category.items.find((candidate) => candidate.id === fieldId)
    if (item) return item
  }
  return null
}

function diagnosticItemContextLabel(label: string, side: AttachmentContextSide) {
  if (side === 'LEFT') return `${label} - левая сторона`
  if (side === 'RIGHT') return `${label} - правая сторона`
  return label
}

function assertContextSide(
  side: AttachmentContextSide,
  allowed: AttachmentContextSide[],
  message: string,
) {
  if (!allowed.includes(side)) {
    throw new AppError(400, 'BAD_REQUEST', message)
  }
}

function toJsonPayload(payload: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue
}
