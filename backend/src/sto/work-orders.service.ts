import type {
  ChangeWorkOrderStatusInput,
  CreateWorkOrderInput,
  ListWorkOrdersQuery,
  UpdateWorkOrderInput,
} from '@autoservice-app/contracts'

import type { DbClient } from '../db'
import { Prisma } from '../generated/prisma/client'
import type { WorkOrderStatus } from '../generated/prisma/enums'
import { AppError } from '../http/errors'
import {
  requireCanChangeWorkOrderStatus,
  requireCanEditWorkOrder,
  requireCanReadWorkOrder,
  requireOrganizationScope,
  requireWorkOrderCreate,
  workOrderScopeWhere,
} from './sto-access'
import type { StoContext } from './sto-context'
import { toWorkOrderDetailDto, toWorkOrderListItemDto } from './sto-mappers'

const workOrderInclude = {
  serviceCenter: true,
  customer: true,
  vehicle: true,
  responsibleStaffProfile: true,
} as const

const workOrderDetailInclude = {
  organization: true,
  serviceCenter: true,
  customer: true,
  vehicle: true,
  responsibleStaffProfile: true,
  createdByStaffProfile: true,
  statusHistory: {
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
  inspectionAct: {
    select: {
      id: true,
    },
  },
  diagnostics: {
    select: {
      id: true,
    },
  },
  recommendations: {
    select: {
      id: true,
      status: true,
    },
  },
  attachments: {
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
    },
  },
} as const

export class WorkOrdersService {
  constructor(private readonly db: DbClient) {}

  async list(context: StoContext, query: ListWorkOrdersQuery = {}) {
    const limit = query.limit ?? 50
    const workOrders = await this.db.workOrder.findMany({
      where: {
        ...workOrderScopeWhere(context),
        ...(query.status ? { status: Array.isArray(query.status) ? { in: query.status } : query.status } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query.responsibleStaffProfileId
          ? { responsibleStaffProfileId: query.responsibleStaffProfileId }
          : {}),
        ...(query.search
          ? {
              OR: [
                { number: { contains: query.search } },
                { customer: { name: { contains: query.search } } },
                { vehicle: { brandModel: { contains: query.search } } },
                { vehicle: { vin: { contains: query.search } } },
                { vehicle: { plate: { contains: query.search } } },
              ],
            }
          : {}),
      },
      include: workOrderInclude,
      orderBy: orderBy(query.sort),
      take: limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })

    return {
      items: workOrders.map(toWorkOrderListItemDto),
      nextCursor: workOrders.length === limit ? workOrders.at(-1)?.id ?? null : null,
    }
  }

  async create(context: StoContext, input: CreateWorkOrderInput) {
    requireWorkOrderCreate(context)

    const organizationId = context.staffProfile.organizationId
    const serviceCenterId = input.serviceCenterId ?? context.staffProfile.serviceCenterId ?? null
    await this.assertServiceCenterInScope(context, serviceCenterId)
    await this.assertStaffProfileInScope(context, input.responsibleStaffProfileId ?? null)

    const created = await this.db
      .$transaction(async (tx) => {
        const customerId = await this.resolveCustomerId(tx, context, input)
        const vehicleId = await this.resolveVehicleId(tx, context, input, customerId)
        const status: WorkOrderStatus = 'OPEN'

        const workOrder = await tx.workOrder.create({
          data: {
            organizationId,
            serviceCenterId,
            customerId,
            vehicleId,
            number: input.number ?? generateWorkOrderNumber(),
            status,
            visitReason: input.visitReason ?? null,
            mileage: input.mileage ?? null,
            responsibleStaffProfileId: input.responsibleStaffProfileId ?? null,
            createdByStaffProfileId: context.staffProfile.id,
          },
        })

        await tx.workOrderStatusHistory.create({
          data: {
            organizationId,
            workOrderId: workOrder.id,
            fromStatus: null,
            toStatus: status,
            changedByStaffProfileId: context.staffProfile.id,
          },
        })

        await tx.auditLog.create({
          data: {
            organizationId,
            staffProfileId: context.staffProfile.id,
            entityType: 'work_order',
            entityId: workOrder.id,
            action: 'work_order_created',
            payloadJson: toJsonPayload(input),
          },
        })

        return workOrder
      })
      .catch((error: unknown) => {
        if (isUniqueConstraintError(error)) {
          throw new AppError(409, 'CONFLICT', 'Work order number already exists')
        }
        throw error
      })

    return this.get(context, created.id)
  }

  async get(context: StoContext, id: string) {
    const workOrder = await this.db.workOrder.findUnique({
      where: { id },
      include: workOrderDetailInclude,
    })
    if (!workOrder) throw new AppError(404, 'NOT_FOUND', 'Work order not found')
    requireCanReadWorkOrder(context, workOrder)
    return toWorkOrderDetailDto(workOrder)
  }

  async update(context: StoContext, id: string, input: UpdateWorkOrderInput) {
    const current = await this.db.workOrder.findUnique({ where: { id } })
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Work order not found')
    requireCanEditWorkOrder(context, current)

    if (input.customerId !== undefined) await this.assertCustomerInScope(context, input.customerId)
    if (input.vehicleId !== undefined) await this.assertVehicleInScope(context, input.vehicleId)
    if (input.serviceCenterId !== undefined) await this.assertServiceCenterInScope(context, input.serviceCenterId)
    if (input.responsibleStaffProfileId !== undefined) {
      await this.assertStaffProfileInScope(context, input.responsibleStaffProfileId)
    }

    await this.db.workOrder.update({
      where: { id },
      data: {
        ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
        ...(input.vehicleId !== undefined ? { vehicleId: input.vehicleId } : {}),
        ...(input.serviceCenterId !== undefined ? { serviceCenterId: input.serviceCenterId } : {}),
        ...(input.responsibleStaffProfileId !== undefined
          ? { responsibleStaffProfileId: input.responsibleStaffProfileId }
          : {}),
        ...(input.visitReason !== undefined ? { visitReason: input.visitReason } : {}),
        ...(input.mileage !== undefined ? { mileage: input.mileage } : {}),
      },
    })

    await this.audit(context, id, 'work_order_updated', input)
    return this.get(context, id)
  }

  async changeStatus(context: StoContext, id: string, input: ChangeWorkOrderStatusInput) {
    const current = await this.db.workOrder.findUnique({ where: { id } })
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Work order not found')
    requireCanChangeWorkOrderStatus(context, current, input.status)

    await this.db.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id },
        data: {
          status: input.status,
          ...(input.status === 'CLOSED' && current.closedAt === null ? { closedAt: new Date() } : {}),
        },
      })

      await tx.workOrderStatusHistory.create({
        data: {
          organizationId: current.organizationId,
          workOrderId: id,
          fromStatus: current.status,
          toStatus: input.status,
          comment: input.comment ?? null,
          changedByStaffProfileId: context.staffProfile.id,
        },
      })

      await tx.auditLog.create({
        data: {
          organizationId: current.organizationId,
          staffProfileId: context.staffProfile.id,
          entityType: 'work_order',
          entityId: id,
          action: 'work_order_status_changed',
          payloadJson: toJsonPayload(input),
        },
      })
    })

    return this.get(context, id)
  }

  private async resolveCustomerId(
    tx: Prisma.TransactionClient,
    context: StoContext,
    input: CreateWorkOrderInput,
  ) {
    if (input.customerId) {
      await this.assertCustomerInScope(context, input.customerId)
      return input.customerId
    }

    if (!input.customer) return null

    const customer = await tx.customer.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        name: input.customer.name ?? null,
        phone: input.customer.phone ?? null,
        email: input.customer.email ?? null,
        notes: input.customer.notes ?? null,
      },
    })

    return customer.id
  }

  private async resolveVehicleId(
    tx: Prisma.TransactionClient,
    context: StoContext,
    input: CreateWorkOrderInput,
    customerId: string | null,
  ) {
    if (input.vehicleId) {
      await this.assertVehicleInScope(context, input.vehicleId)
      return input.vehicleId
    }

    if (!input.vehicle) {
      throw new AppError(400, 'BAD_REQUEST', 'Provide vehicleId or nested vehicle data')
    }

    const vehicle = await tx.vehicle.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        customerId,
        brand: input.vehicle.brand ?? null,
        model: input.vehicle.model ?? null,
        brandModel: input.vehicle.brandModel,
        vin: input.vehicle.vin ?? null,
        plate: input.vehicle.plate ?? null,
        engineSpec: input.vehicle.engineSpec ?? null,
        year: input.vehicle.year ?? null,
        currentMileage: input.vehicle.currentMileage ?? null,
        notes: input.vehicle.notes ?? null,
      },
    })

    return vehicle.id
  }

  private async assertCustomerInScope(context: StoContext, customerId: string | null) {
    if (!customerId) return
    const customer = await this.db.customer.findUnique({
      where: { id: customerId },
      select: { organizationId: true },
    })
    if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer not found')
    requireOrganizationScope(context, customer.organizationId)
  }

  private async assertVehicleInScope(context: StoContext, vehicleId: string) {
    const vehicle = await this.db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { organizationId: true },
    })
    if (!vehicle) throw new AppError(404, 'NOT_FOUND', 'Vehicle not found')
    requireOrganizationScope(context, vehicle.organizationId)
  }

  private async assertServiceCenterInScope(context: StoContext, serviceCenterId: string | null) {
    if (!serviceCenterId) return
    const serviceCenter = await this.db.serviceCenter.findUnique({
      where: { id: serviceCenterId },
      select: { organizationId: true },
    })
    if (!serviceCenter) throw new AppError(404, 'NOT_FOUND', 'Service center not found')
    requireOrganizationScope(context, serviceCenter.organizationId)
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
        entityType: 'work_order',
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

function orderBy(sort: ListWorkOrdersQuery['sort']) {
  if (sort === 'created_asc') return { createdAt: 'asc' as const }
  if (sort === 'updated_desc') return { updatedAt: 'desc' as const }
  return { createdAt: 'desc' as const }
}

function generateWorkOrderNumber() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `WO-${date}-${now.getTime().toString(36).toUpperCase()}`
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
