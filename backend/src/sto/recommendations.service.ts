import type {
  CreateRecommendationInput,
  ListRecommendationsQuery,
  UpdateRecommendationInput,
} from '@autoservice-app/contracts'

import type { DbClient } from '../db'
import { Prisma } from '../generated/prisma/client'
import { AppError } from '../http/errors'
import { requireCanReadWorkOrder } from './sto-access'
import type { StoContext } from './sto-context'
import { recommendationTotal } from './sto-json-forms'
import { toRecommendationDto } from './sto-mappers'

const managerRoles = ['MASTER', 'DIRECTOR', 'ADMIN'] as const

export class RecommendationsService {
  constructor(private readonly db: DbClient) {}

  async list(context: StoContext, workOrderId: string, query: ListRecommendationsQuery = {}) {
    await this.getWorkOrderForAccess(context, workOrderId)
    const limit = query.limit ?? 50
    const recommendations = await this.db.recommendation.findMany({
      where: {
        workOrderId,
        ...(query.status
          ? { status: Array.isArray(query.status) ? { in: query.status } : query.status }
          : {}),
        ...(query.search ? { text: { contains: query.search } } : {}),
      },
      orderBy: orderBy(query.sort),
      take: limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })

    return {
      items: recommendations.map(toRecommendationDto),
      nextCursor: recommendations.length === limit ? recommendations.at(-1)?.id ?? null : null,
    }
  }

  async create(context: StoContext, workOrderId: string, input: CreateRecommendationInput) {
    const workOrder = await this.getWorkOrderForAccess(context, workOrderId)
    if (input.workOrderId && input.workOrderId !== workOrderId) {
      throw new AppError(400, 'BAD_REQUEST', 'Recommendation workOrderId must match route work order')
    }
    if (context.role === 'MECHANIC' && input.status && input.status !== 'SUGGESTED') {
      throw new AppError(403, 'FORBIDDEN', 'Mechanics can only suggest recommendations')
    }
    await this.assertLinkedRecords(context, workOrderId, input)

    const recommendation = await this.db.recommendation.create({
      data: {
        organizationId: workOrder.organizationId,
        workOrderId,
        diagnosticId: input.diagnosticId ?? null,
        inspectionActId: input.inspectionActId ?? null,
        text: input.text,
        status: input.status ?? 'SUGGESTED',
        partsPrice: input.partsPrice ?? null,
        servicePrice: input.servicePrice ?? null,
        totalPrice: recommendationTotal(input),
        createdByStaffProfileId: context.staffProfile.id,
      },
    })

    await this.audit(context, recommendation.id, 'recommendation_created', input)
    return toRecommendationDto(recommendation)
  }

  async update(context: StoContext, recommendationId: string, input: UpdateRecommendationInput) {
    const current = await this.db.recommendation.findUnique({
      where: { id: recommendationId },
      include: { workOrder: true },
    })
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Recommendation not found')
    requireCanReadWorkOrder(context, current.workOrder)

    if (!isManager(context.role)) {
      const canEditOwnSuggested =
        current.status === 'SUGGESTED' &&
        current.createdByStaffProfileId === context.staffProfile.id &&
        (input.status === undefined || input.status === 'SUGGESTED')
      if (!canEditOwnSuggested) {
        throw new AppError(403, 'FORBIDDEN', 'Mechanics can edit only their own suggested recommendations')
      }
    }
    await this.assertLinkedRecords(context, current.workOrderId, input)

    const nextPartsPrice = input.partsPrice === undefined ? current.partsPrice : input.partsPrice
    const nextServicePrice = input.servicePrice === undefined ? current.servicePrice : input.servicePrice
    const nextTotalPrice =
      input.totalPrice === undefined
        ? recommendationTotal({ partsPrice: nextPartsPrice, servicePrice: nextServicePrice })
        : recommendationTotal({ totalPrice: input.totalPrice })

    const recommendation = await this.db.recommendation.update({
      where: { id: recommendationId },
      data: {
        ...(input.diagnosticId !== undefined ? { diagnosticId: input.diagnosticId } : {}),
        ...(input.inspectionActId !== undefined ? { inspectionActId: input.inspectionActId } : {}),
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.partsPrice !== undefined ? { partsPrice: input.partsPrice } : {}),
        ...(input.servicePrice !== undefined ? { servicePrice: input.servicePrice } : {}),
        totalPrice: nextTotalPrice,
        updatedByStaffProfileId: context.staffProfile.id,
      },
    })

    await this.audit(context, recommendation.id, 'recommendation_updated', input)
    return toRecommendationDto(recommendation)
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
    input: Pick<CreateRecommendationInput, 'diagnosticId' | 'inspectionActId'>,
  ) {
    if (input.diagnosticId) {
      const diagnostic = await this.db.diagnostic.findUnique({
        where: { id: input.diagnosticId },
        select: { workOrderId: true, organizationId: true },
      })
      if (!diagnostic) throw new AppError(404, 'NOT_FOUND', 'Diagnostic not found')
      if (diagnostic.workOrderId !== workOrderId || diagnostic.organizationId !== context.staffProfile.organizationId) {
        throw new AppError(400, 'BAD_REQUEST', 'Diagnostic belongs to another work order')
      }
    }

    if (input.inspectionActId) {
      const inspectionAct = await this.db.inspectionAct.findUnique({
        where: { id: input.inspectionActId },
        select: { workOrderId: true, organizationId: true },
      })
      if (!inspectionAct) throw new AppError(404, 'NOT_FOUND', 'Inspection act not found')
      if (inspectionAct.workOrderId !== workOrderId || inspectionAct.organizationId !== context.staffProfile.organizationId) {
        throw new AppError(400, 'BAD_REQUEST', 'Inspection act belongs to another work order')
      }
    }
  }

  private audit(context: StoContext, entityId: string, action: string, payload: unknown) {
    return this.db.auditLog.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        staffProfileId: context.staffProfile.id,
        entityType: 'recommendation',
        entityId,
        action,
        payloadJson: toJsonPayload(payload),
      },
    })
  }
}

function isManager(role: StoContext['role']) {
  return managerRoles.some((candidate) => candidate === role)
}

function orderBy(sort: ListRecommendationsQuery['sort']) {
  if (sort === 'created_asc') return { createdAt: 'asc' as const }
  if (sort === 'updated_desc') return { updatedAt: 'desc' as const }
  return { createdAt: 'desc' as const }
}

function toJsonPayload(payload: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue
}
