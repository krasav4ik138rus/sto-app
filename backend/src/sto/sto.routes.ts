import {
  changeWorkOrderStatusInputSchema,
  createAttachmentMetadataInputSchema,
  createCustomerInputSchema,
  createDiagnosticInputSchema,
  createRecommendationInputSchema,
  createVehicleInputSchema,
  createWorkOrderInputSchema,
  listAttachmentsQuerySchema,
  listCustomersQuerySchema,
  listRecommendationsQuerySchema,
  listVehiclesQuerySchema,
  listWorkOrdersQuerySchema,
  patchInspectionActInputSchema,
  updateDiagnosticInputSchema,
  updateRecommendationInputSchema,
  updateCustomerInputSchema,
  updateVehicleInputSchema,
  updateWorkOrderInputSchema,
  upsertInspectionActInputSchema,
} from '@autoservice-app/contracts'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'

import type { AppBindings } from '../app'
import { AppError } from '../http/errors'
import { AttachmentsService } from './attachments.service'
import { DiagnosticsService } from './diagnostics.service'
import { InspectionService } from './inspection.service'
import { RecommendationsService } from './recommendations.service'
import { SummaryService } from './summary.service'
import { getStoContext } from './sto-context'
import { CustomersService } from './customers.service'
import { toOrganizationDto, toServiceCenterDto, toStaffProfileDto } from './sto-mappers'
import { VehiclesService } from './vehicles.service'
import { WorkOrdersService } from './work-orders.service'

const idParamsSchema = z.object({
  id: z.string().min(1),
})

const diagnosticIdParamsSchema = z.object({
  diagnosticId: z.string().min(1),
})

const recommendationIdParamsSchema = z.object({
  recommendationId: z.string().min(1),
})

const attachmentIdParamsSchema = z.object({
  attachmentId: z.string().min(1),
})

export function createStoRoutes() {
  const routes = new Hono<AppBindings>()

  routes.get('/me', async (c) => {
    const context = await getStoContext(c)
    return c.json(
      {
        user: context.user,
        staffProfile: toStaffProfileDto(context.staffProfile),
        organization: toOrganizationDto(context.organization),
        serviceCenter: context.serviceCenter ? toServiceCenterDto(context.serviceCenter) : null,
        role: context.role,
      },
      200,
    )
  })

  routes.get('/service-centers', async (c) => {
    const context = await getStoContext(c)
    const prisma = c.get('prisma')
    const serviceCenters = await prisma.serviceCenter.findMany({
      where: {
        organizationId: context.staffProfile.organizationId,
        isActive: true,
        ...(context.role === 'MASTER' || context.role === 'MECHANIC'
          ? context.staffProfile.serviceCenterId
            ? { id: context.staffProfile.serviceCenterId }
            : { id: { equals: '__no_service_center__' } }
          : {}),
      },
      orderBy: {
        name: 'asc',
      },
    })

    return c.json({ items: serviceCenters.map(toServiceCenterDto) }, 200)
  })

  routes.get('/customers', async (c) => {
    const context = await getStoContext(c)
    const service = new CustomersService(c.get('prisma'))
    return c.json(await service.list(context, listCustomersQuerySchema.parse(c.req.query())), 200)
  })

  routes.post('/customers', async (c) => {
    const context = await getStoContext(c)
    const service = new CustomersService(c.get('prisma'))
    return c.json(await service.create(context, createCustomerInputSchema.parse(await jsonBody(c))), 201)
  })

  routes.get('/customers/:id', async (c) => {
    const context = await getStoContext(c)
    const service = new CustomersService(c.get('prisma'))
    return c.json(await service.get(context, idParamsSchema.parse(c.req.param()).id), 200)
  })

  routes.patch('/customers/:id', async (c) => {
    const context = await getStoContext(c)
    const service = new CustomersService(c.get('prisma'))
    return c.json(
      await service.update(
        context,
        idParamsSchema.parse(c.req.param()).id,
        updateCustomerInputSchema.parse(await jsonBody(c)),
      ),
      200,
    )
  })

  routes.get('/vehicles', async (c) => {
    const context = await getStoContext(c)
    const service = new VehiclesService(c.get('prisma'))
    return c.json(await service.list(context, listVehiclesQuerySchema.parse(c.req.query())), 200)
  })

  routes.post('/vehicles', async (c) => {
    const context = await getStoContext(c)
    const service = new VehiclesService(c.get('prisma'))
    return c.json(await service.create(context, createVehicleInputSchema.parse(await jsonBody(c))), 201)
  })

  routes.get('/vehicles/:id', async (c) => {
    const context = await getStoContext(c)
    const service = new VehiclesService(c.get('prisma'))
    return c.json(await service.get(context, idParamsSchema.parse(c.req.param()).id), 200)
  })

  routes.patch('/vehicles/:id', async (c) => {
    const context = await getStoContext(c)
    const service = new VehiclesService(c.get('prisma'))
    return c.json(
      await service.update(
        context,
        idParamsSchema.parse(c.req.param()).id,
        updateVehicleInputSchema.parse(await jsonBody(c)),
      ),
      200,
    )
  })

  routes.get('/orders', async (c) => {
    const context = await getStoContext(c)
    const service = new WorkOrdersService(c.get('prisma'))
    return c.json(await service.list(context, listWorkOrdersQuerySchema.parse(c.req.query())), 200)
  })

  routes.post('/orders', async (c) => {
    const context = await getStoContext(c)
    const service = new WorkOrdersService(c.get('prisma'))
    return c.json(await service.create(context, createWorkOrderInputSchema.parse(await jsonBody(c))), 201)
  })

  routes.get('/orders/:id', async (c) => {
    const context = await getStoContext(c)
    const service = new WorkOrdersService(c.get('prisma'))
    return c.json(await service.get(context, idParamsSchema.parse(c.req.param()).id), 200)
  })

  routes.patch('/orders/:id', async (c) => {
    const context = await getStoContext(c)
    const body = await jsonBody(c)
    if (hasOwn(body, 'status')) {
      throw new AppError(400, 'BAD_REQUEST', 'Use POST /api/sto/orders/:id/status to change status')
    }

    const service = new WorkOrdersService(c.get('prisma'))
    return c.json(
      await service.update(
        context,
        idParamsSchema.parse(c.req.param()).id,
        updateWorkOrderInputSchema.parse(body),
      ),
      200,
    )
  })

  routes.post('/orders/:id/status', async (c) => {
    const context = await getStoContext(c)
    const service = new WorkOrdersService(c.get('prisma'))
    return c.json(
      await service.changeStatus(
        context,
        idParamsSchema.parse(c.req.param()).id,
        changeWorkOrderStatusInputSchema.parse(await jsonBody(c)),
      ),
      200,
    )
  })

  routes.get('/orders/:id/inspection', async (c) => {
    const context = await getStoContext(c)
    const service = new InspectionService(c.get('prisma'))
    return c.json(await service.get(context, idParamsSchema.parse(c.req.param()).id), 200)
  })

  routes.put('/orders/:id/inspection', async (c) => {
    const context = await getStoContext(c)
    const service = new InspectionService(c.get('prisma'))
    return c.json(
      await service.upsert(
        context,
        idParamsSchema.parse(c.req.param()).id,
        upsertInspectionActInputSchema.parse(await jsonBody(c)),
      ),
      200,
    )
  })

  routes.patch('/orders/:id/inspection', async (c) => {
    const context = await getStoContext(c)
    const service = new InspectionService(c.get('prisma'))
    return c.json(
      await service.patch(
        context,
        idParamsSchema.parse(c.req.param()).id,
        patchInspectionActInputSchema.parse(await jsonBody(c)),
      ),
      200,
    )
  })

  routes.get('/orders/:id/diagnostics', async (c) => {
    const context = await getStoContext(c)
    const service = new DiagnosticsService(c.get('prisma'))
    return c.json(await service.list(context, idParamsSchema.parse(c.req.param()).id), 200)
  })

  routes.post('/orders/:id/diagnostics', async (c) => {
    const context = await getStoContext(c)
    const service = new DiagnosticsService(c.get('prisma'))
    return c.json(
      await service.create(
        context,
        idParamsSchema.parse(c.req.param()).id,
        createDiagnosticInputSchema.parse(await jsonBody(c)),
      ),
      201,
    )
  })

  routes.get('/diagnostics/:diagnosticId', async (c) => {
    const context = await getStoContext(c)
    const service = new DiagnosticsService(c.get('prisma'))
    return c.json(await service.get(context, diagnosticIdParamsSchema.parse(c.req.param()).diagnosticId), 200)
  })

  routes.put('/diagnostics/:diagnosticId', async (c) => {
    const context = await getStoContext(c)
    const service = new DiagnosticsService(c.get('prisma'))
    return c.json(
      await service.update(
        context,
        diagnosticIdParamsSchema.parse(c.req.param()).diagnosticId,
        updateDiagnosticInputSchema.parse(await jsonBody(c)),
      ),
      200,
    )
  })

  routes.patch('/diagnostics/:diagnosticId', async (c) => {
    const context = await getStoContext(c)
    const service = new DiagnosticsService(c.get('prisma'))
    return c.json(
      await service.update(
        context,
        diagnosticIdParamsSchema.parse(c.req.param()).diagnosticId,
        updateDiagnosticInputSchema.parse(await jsonBody(c)),
      ),
      200,
    )
  })

  routes.get('/orders/:id/recommendations', async (c) => {
    const context = await getStoContext(c)
    const service = new RecommendationsService(c.get('prisma'))
    return c.json(
      await service.list(
        context,
        idParamsSchema.parse(c.req.param()).id,
        listRecommendationsQuerySchema.parse(c.req.query()),
      ),
      200,
    )
  })

  routes.post('/orders/:id/recommendations', async (c) => {
    const context = await getStoContext(c)
    const service = new RecommendationsService(c.get('prisma'))
    return c.json(
      await service.create(
        context,
        idParamsSchema.parse(c.req.param()).id,
        createRecommendationInputSchema.parse(await jsonBody(c)),
      ),
      201,
    )
  })

  routes.patch('/recommendations/:recommendationId', async (c) => {
    const context = await getStoContext(c)
    const service = new RecommendationsService(c.get('prisma'))
    return c.json(
      await service.update(
        context,
        recommendationIdParamsSchema.parse(c.req.param()).recommendationId,
        updateRecommendationInputSchema.parse(await jsonBody(c)),
      ),
      200,
    )
  })

  routes.get('/orders/:id/attachments', async (c) => {
    const context = await getStoContext(c)
    const service = new AttachmentsService(c.get('prisma'))
    return c.json(
      await service.list(
        context,
        idParamsSchema.parse(c.req.param()).id,
        listAttachmentsQuerySchema.parse(c.req.query()),
      ),
      200,
    )
  })

  routes.post('/orders/:id/attachments', async (c) => {
    const context = await getStoContext(c)
    const service = new AttachmentsService(c.get('prisma'))
    return c.json(
      await service.create(
        context,
        idParamsSchema.parse(c.req.param()).id,
        createAttachmentMetadataInputSchema.parse(await jsonBody(c)),
      ),
      201,
    )
  })

  routes.delete('/attachments/:attachmentId', async (c) => {
    const context = await getStoContext(c)
    const service = new AttachmentsService(c.get('prisma'))
    return c.json(await service.delete(context, attachmentIdParamsSchema.parse(c.req.param()).attachmentId), 200)
  })

  routes.get('/orders/:id/summary', async (c) => {
    const context = await getStoContext(c)
    const service = new SummaryService(c.get('prisma'))
    return c.json(await service.get(context, idParamsSchema.parse(c.req.param()).id), 200)
  })

  return routes
}

async function jsonBody(c: Context) {
  const contentType = c.req.header('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new AppError(400, 'BAD_REQUEST', 'Expected application/json request body')
  }

  return c.req.json().catch(() => {
    throw new AppError(400, 'BAD_REQUEST', 'Invalid JSON request body')
  })
}

function hasOwn(value: unknown, key: string) {
  return typeof value === 'object' && value !== null && Object.prototype.hasOwnProperty.call(value, key)
}
