import type { DbClient } from '../db'
import { AppError } from '../http/errors'
import { requireCanReadWorkOrder } from './sto-access'
import type { StoContext } from './sto-context'
import { toWorkOrderSummaryDto } from './sto-mappers'

export class SummaryService {
  constructor(private readonly db: DbClient) {}

  async get(context: StoContext, workOrderId: string) {
    const workOrder = await this.db.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        serviceCenter: true,
        customer: true,
        vehicle: true,
        inspectionAct: true,
        diagnostics: {
          orderBy: { createdAt: 'desc' },
        },
        recommendations: {
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!workOrder) throw new AppError(404, 'NOT_FOUND', 'Work order not found')
    requireCanReadWorkOrder(context, workOrder)

    return toWorkOrderSummaryDto(workOrder)
  }
}
