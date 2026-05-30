import {
  inspectionActDataSchema,
  type PatchInspectionActInput,
  type UpsertInspectionActInput,
} from '@autoservice-app/contracts'

import type { DbClient } from '../db'
import { Prisma } from '../generated/prisma/client'
import { AppError } from '../http/errors'
import { requireCanReadWorkOrder } from './sto-access'
import type { StoContext } from './sto-context'
import { toInspectionActDto } from './sto-mappers'

export class InspectionService {
  constructor(private readonly db: DbClient) {}

  async get(context: StoContext, workOrderId: string) {
    const workOrder = await this.getWorkOrderForAccess(context, workOrderId)
    const inspectionAct = await this.db.inspectionAct.findUnique({
      where: { workOrderId },
    })

    return {
      orderId: workOrder.id,
      inspectionAct: inspectionAct ? toInspectionActDto(inspectionAct) : null,
    }
  }

  async upsert(context: StoContext, workOrderId: string, input: UpsertInspectionActInput) {
    const workOrder = await this.getWorkOrderForAccess(context, workOrderId)
    const dataJson = inspectionActDataSchema.parse(input.dataJson)
    const existing = await this.db.inspectionAct.findUnique({
      where: { workOrderId },
      select: { id: true },
    })

    const inspectionAct = await this.db.inspectionAct.upsert({
      where: { workOrderId },
      create: {
        organizationId: workOrder.organizationId,
        workOrderId,
        dataJson: toJsonPayload(dataJson),
        schemaVersion: dataJson.schemaVersion,
        completedAt: input.completedAt ? new Date(input.completedAt) : null,
        createdByStaffProfileId: context.staffProfile.id,
      },
      update: {
        dataJson: toJsonPayload(dataJson),
        schemaVersion: dataJson.schemaVersion,
        completedAt: input.completedAt === undefined ? undefined : input.completedAt ? new Date(input.completedAt) : null,
        updatedByStaffProfileId: context.staffProfile.id,
      },
    })

    await this.audit(
      context,
      inspectionAct.id,
      existing ? 'inspection_updated' : 'inspection_created',
      input,
    )

    return {
      orderId: workOrder.id,
      inspectionAct: toInspectionActDto(inspectionAct),
    }
  }

  async patch(context: StoContext, workOrderId: string, input: PatchInspectionActInput) {
    await this.getWorkOrderForAccess(context, workOrderId)
    const dataJson = input.dataJson ? inspectionActDataSchema.parse(input.dataJson) : null
    const existing = await this.db.inspectionAct.findUnique({
      where: { workOrderId },
    })
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Inspection act not found')

    const inspectionAct = await this.db.inspectionAct.update({
      where: { workOrderId },
      data: {
        ...(dataJson
          ? {
              dataJson: toJsonPayload(dataJson),
              schemaVersion: dataJson.schemaVersion,
            }
          : {}),
        ...(input.completedAt !== undefined
          ? { completedAt: input.completedAt ? new Date(input.completedAt) : null }
          : {}),
        updatedByStaffProfileId: context.staffProfile.id,
      },
    })

    await this.audit(context, inspectionAct.id, 'inspection_updated', input)

    return {
      orderId: workOrderId,
      inspectionAct: toInspectionActDto(inspectionAct),
    }
  }

  private async getWorkOrderForAccess(context: StoContext, workOrderId: string) {
    const workOrder = await this.db.workOrder.findUnique({ where: { id: workOrderId } })
    if (!workOrder) throw new AppError(404, 'NOT_FOUND', 'Work order not found')
    requireCanReadWorkOrder(context, workOrder)
    return workOrder
  }

  private audit(context: StoContext, entityId: string, action: string, payload: unknown) {
    return this.db.auditLog.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        staffProfileId: context.staffProfile.id,
        entityType: 'inspection_act',
        entityId,
        action,
        payloadJson: toJsonPayload(payload),
      },
    })
  }
}

function toJsonPayload(payload: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue
}
