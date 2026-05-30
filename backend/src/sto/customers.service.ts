import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from '@autoservice-app/contracts'

import type { DbClient } from '../db'
import { Prisma } from '../generated/prisma/client'
import { AppError } from '../http/errors'
import { requireCustomerWrite, requireOrganizationScope } from './sto-access'
import type { StoContext } from './sto-context'
import { toCustomerDto } from './sto-mappers'

export class CustomersService {
  constructor(private readonly db: DbClient) {}

  async list(context: StoContext, query: ListCustomersQuery = {}) {
    const limit = query.limit ?? 50
    const customers = await this.db.customer.findMany({
      where: {
        organizationId: context.staffProfile.organizationId,
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search } },
                { phone: { contains: query.search } },
                { email: { contains: query.search } },
              ],
            }
          : {}),
      },
      orderBy: orderBy(query.sort),
      take: limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })

    return {
      items: customers.map(toCustomerDto),
      nextCursor: customers.length === limit ? customers.at(-1)?.id ?? null : null,
    }
  }

  async create(context: StoContext, input: CreateCustomerInput) {
    requireCustomerWrite(context)

    const customer = await this.db.customer.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        name: input.name ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        notes: input.notes ?? null,
      },
    })

    await this.audit(context, customer.id, 'customer_created', input)
    return toCustomerDto(customer)
  }

  async get(context: StoContext, id: string) {
    const customer = await this.db.customer.findUnique({ where: { id } })
    if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer not found')
    requireOrganizationScope(context, customer.organizationId)
    return toCustomerDto(customer)
  }

  async update(context: StoContext, id: string, input: UpdateCustomerInput) {
    requireCustomerWrite(context)
    await this.get(context, id)

    const customer = await this.db.customer.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    })

    await this.audit(context, customer.id, 'customer_updated', input)
    return toCustomerDto(customer)
  }

  private audit(context: StoContext, entityId: string, action: string, payload: unknown) {
    return this.db.auditLog.create({
      data: {
        organizationId: context.staffProfile.organizationId,
        staffProfileId: context.staffProfile.id,
        entityType: 'customer',
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

function orderBy(sort: ListCustomersQuery['sort']) {
  if (sort === 'created_asc') return { createdAt: 'asc' as const }
  if (sort === 'name_asc') return { name: 'asc' as const }
  return { createdAt: 'desc' as const }
}
