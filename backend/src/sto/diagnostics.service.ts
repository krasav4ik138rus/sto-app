import {
  diagnosticDataSchema,
  type CreateDiagnosticInput,
  type UpdateDiagnosticInput,
} from '@autoservice-app/contracts'

import type { DbClient } from '../db'
import { Prisma } from '../generated/prisma/client'
import { AppError } from '../http/errors'
import { requireCanReadWorkOrder, requireOrganizationScope } from './sto-access'
import type { StoContext } from './sto-context'
import { diagnosticTotalsFromInput } from './sto-json-forms'
import { toDiagnosticDto } from './sto-mappers'

export class DiagnosticsService {
  constructor(private readonly db: DbClient) {}

  async list(context: StoContext, workOrderId: string) {
    await this.getWorkOrderForAccess(context, workOrderId)
    const diagnostics = await this.db.diagnostic.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'desc' },
    })

    return { items: diagnostics.map(toDiagnosticDto) }
  }

  async create(context: StoContext, workOrderId: string, input: CreateDiagnosticInput) {
    const workOrder = await this.getWorkOrderForAccess(context, workOrderId)
    await this.assertStaffProfileInScope(context, input.executorStaffProfileId ?? null)
    const dataJson = diagnosticDataSchema.parse(input.dataJson)
    const totals = diagnosticTotalsFromInput({ ...input, dataJson })
    const diagnostic = await this.db.diagnostic.create({
      data: {
        organizationId: workOrder.organizationId,
        workOrderId,
        dataJson: toJsonPayload(dataJson),
        schemaVersion: dataJson.schemaVersion,
        otherRecommendations: input.otherRecommendations ?? dataJson.totals?.otherRecommendations ?? null,
        alignmentComment: input.alignmentComment ?? dataJson.totals?.alignmentComment ?? null,
        partsTotal: totals.partsTotal,
        serviceTotal: totals.serviceTotal,
        grandTotal: totals.grandTotal,
        executorStaffProfileId: input.executorStaffProfileId ?? context.staffProfile.id,
        createdByStaffProfileId: context.staffProfile.id,
      },
    })

    await this.audit(context, diagnostic.id, 'diagnostic_created', input)
    return toDiagnosticDto(diagnostic)
  }

  async get(context: StoContext, diagnosticId: string) {
    const diagnostic = await this.getDiagnosticForAccess(context, diagnosticId)
    return toDiagnosticDto(diagnostic)
  }

  async update(context: StoContext, diagnosticId: string, input: UpdateDiagnosticInput) {
    const current = await this.getDiagnosticForAccess(context, diagnosticId)
    await this.assertStaffProfileInScope(context, input.executorStaffProfileId ?? null)

    const parsedInputDataJson = input.dataJson ? diagnosticDataSchema.parse(input.dataJson) : null
    const nextDataJson = parsedInputDataJson ?? toDiagnosticDto(current).dataJson
    const totals = diagnosticTotalsFromInput({
      dataJson: nextDataJson,
      partsTotal: input.partsTotal,
      serviceTotal: input.serviceTotal,
      grandTotal: input.grandTotal,
    })

    const diagnostic = await this.db.diagnostic.update({
      where: { id: diagnosticId },
      data: {
        ...(parsedInputDataJson
          ? {
              dataJson: toJsonPayload(parsedInputDataJson),
              schemaVersion: parsedInputDataJson.schemaVersion,
            }
          : {}),
        ...(input.otherRecommendations !== undefined
          ? { otherRecommendations: input.otherRecommendations }
          : parsedInputDataJson?.totals?.otherRecommendations !== undefined
            ? { otherRecommendations: parsedInputDataJson.totals.otherRecommendations }
            : {}),
        ...(input.alignmentComment !== undefined
          ? { alignmentComment: input.alignmentComment }
          : parsedInputDataJson?.totals?.alignmentComment !== undefined
            ? { alignmentComment: parsedInputDataJson.totals.alignmentComment }
            : {}),
        ...(input.dataJson || input.partsTotal !== undefined ? { partsTotal: totals.partsTotal } : {}),
        ...(input.dataJson || input.serviceTotal !== undefined ? { serviceTotal: totals.serviceTotal } : {}),
        ...(input.dataJson || input.grandTotal !== undefined ? { grandTotal: totals.grandTotal } : {}),
        ...(input.executorStaffProfileId !== undefined
          ? { executorStaffProfileId: input.executorStaffProfileId }
          : {}),
        updatedByStaffProfileId: context.staffProfile.id,
      },
    })

    await this.audit(context, diagnostic.id, 'diagnostic_updated', input)
    return toDiagnosticDto(diagnostic)
  }

  private async getWorkOrderForAccess(context: StoContext, workOrderId: string) {
    const workOrder = await this.db.workOrder.findUnique({ where: { id: workOrderId } })
    if (!workOrder) throw new AppError(404, 'NOT_FOUND', 'Work order not found')
    requireCanReadWorkOrder(context, workOrder)
    return workOrder
  }

  private async getDiagnosticForAccess(context: StoContext, diagnosticId: string) {
    const diagnostic = await this.db.diagnostic.findUnique({
      where: { id: diagnosticId },
      include: { workOrder: true },
    })
    if (!diagnostic) throw new AppError(404, 'NOT_FOUND', 'Diagnostic not found')
    requireCanReadWorkOrder(context, diagnostic.workOrder)
    return diagnostic
  }

  private async assertStaffProfileInScope(context: StoContext, staffProfileId: string | null) {
    if (!staffProfileId) return
    const staffProfile = await this.db.staffProfile.findUnique({
      where: { id: staffProfileId },
      select: { organizationId: true },
    })
    if (!staffProfile) throw new AppError(404, 'NOT_FOUND', 'Staff profile not found')
    requireOrganizationScope(context, staffProfile.organizationId)
  }

  private audit(context: StoContext, entityId: string, action: string, payload: unknown) {
    return this.db.auditLog.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        staffProfileId: context.staffProfile.id,
        entityType: 'diagnostic',
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
