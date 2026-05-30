import type {
  CreateVehicleInput,
  ListVehiclesQuery,
  UpdateVehicleInput,
} from '@autoservice-app/contracts'

import type { DbClient } from '../db'
import { Prisma } from '../generated/prisma/client'
import { AppError } from '../http/errors'
import { requireOrganizationScope, requireVehicleWrite } from './sto-access'
import type { StoContext } from './sto-context'
import { toVehicleDto } from './sto-mappers'

export class VehiclesService {
  constructor(private readonly db: DbClient) {}

  async list(context: StoContext, query: ListVehiclesQuery = {}) {
    const limit = query.limit ?? 50
    const vehicles = await this.db.vehicle.findMany({
      where: {
        organizationId: context.staffProfile.organizationId,
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.search
          ? {
              OR: [
                { brandModel: { contains: query.search } },
                { vin: { contains: query.search } },
                { plate: { contains: query.search } },
              ],
            }
          : {}),
      },
      orderBy: orderBy(query.sort),
      take: limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })

    return {
      items: vehicles.map(toVehicleDto),
      nextCursor: vehicles.length === limit ? vehicles.at(-1)?.id ?? null : null,
    }
  }

  async create(context: StoContext, input: CreateVehicleInput) {
    requireVehicleWrite(context)
    await this.assertCustomerInScope(context, input.customerId ?? null)

    const vehicle = await this.db.vehicle.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        customerId: input.customerId ?? null,
        brand: input.brand ?? null,
        model: input.model ?? null,
        brandModel: input.brandModel,
        vin: input.vin ?? null,
        plate: input.plate ?? null,
        engineSpec: input.engineSpec ?? null,
        year: input.year ?? null,
        currentMileage: input.currentMileage ?? null,
        notes: input.notes ?? null,
      },
    })

    await this.audit(context, vehicle.id, 'vehicle_created', input)
    return toVehicleDto(vehicle)
  }

  async get(context: StoContext, id: string) {
    const vehicle = await this.db.vehicle.findUnique({ where: { id } })
    if (!vehicle) throw new AppError(404, 'NOT_FOUND', 'Vehicle not found')
    requireOrganizationScope(context, vehicle.organizationId)
    return toVehicleDto(vehicle)
  }

  async update(context: StoContext, id: string, input: UpdateVehicleInput) {
    requireVehicleWrite(context)
    await this.get(context, id)
    if (input.customerId !== undefined) {
      await this.assertCustomerInScope(context, input.customerId)
    }

    const vehicle = await this.db.vehicle.update({
      where: { id },
      data: {
        ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        ...(input.model !== undefined ? { model: input.model } : {}),
        ...(input.brandModel !== undefined ? { brandModel: input.brandModel } : {}),
        ...(input.vin !== undefined ? { vin: input.vin } : {}),
        ...(input.plate !== undefined ? { plate: input.plate } : {}),
        ...(input.engineSpec !== undefined ? { engineSpec: input.engineSpec } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
        ...(input.currentMileage !== undefined ? { currentMileage: input.currentMileage } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    })

    await this.audit(context, vehicle.id, 'vehicle_updated', input)
    return toVehicleDto(vehicle)
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

  private audit(context: StoContext, entityId: string, action: string, payload: unknown) {
    return this.db.auditLog.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        staffProfileId: context.staffProfile.id,
        entityType: 'vehicle',
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

function orderBy(sort: ListVehiclesQuery['sort']) {
  if (sort === 'created_asc') return { createdAt: 'asc' as const }
  if (sort === 'brand_model_asc') return { brandModel: 'asc' as const }
  return { createdAt: 'desc' as const }
}
