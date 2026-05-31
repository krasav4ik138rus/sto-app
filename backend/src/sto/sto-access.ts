import type { StaffRole, WorkOrderStatus } from '../generated/prisma/enums'
import { AppError } from '../http/errors'
import type { StoContext } from './sto-context'

type WorkOrderAccessRecord = {
  organizationId: string
  serviceCenterId: string | null
  responsibleStaffProfileId: string | null
  createdByStaffProfileId: string
}

type WorkOrderStatusAccessRecord = WorkOrderAccessRecord & {
  status: WorkOrderStatus
}

const managerRoles = ['MASTER', 'DIRECTOR', 'ADMIN'] as const satisfies StaffRole[]
const organizationWideRoles = ['DIRECTOR', 'ADMIN'] as const satisfies StaffRole[]
const allStatusTargets = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'APPROVED',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
] as const satisfies readonly WorkOrderStatus[]
const staffStatusTargets = ['IN_PROGRESS', 'AWAITING_APPROVAL', 'CANCELLED'] as const satisfies readonly WorkOrderStatus[]
const masterStatusTargets = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'APPROVED',
  'CANCELLED',
] as const satisfies readonly WorkOrderStatus[]

export function requireStoRole(context: StoContext, roles: readonly StaffRole[]) {
  if (!roles.includes(context.role)) {
    throw new AppError(403, 'FORBIDDEN', 'Insufficient STO role')
  }
}

export function requireOrganizationScope(context: StoContext, organizationId: string) {
  if (context.staffProfile.organizationId !== organizationId) {
    throw new AppError(403, 'FORBIDDEN', 'Resource belongs to another organization')
  }
}

export function requireCustomerWrite(context: StoContext) {
  requireStoRole(context, managerRoles)
}

export function requireVehicleWrite(context: StoContext) {
  requireStoRole(context, managerRoles)
}

export function requireWorkOrderCreate(context: StoContext) {
  requireStoRole(context, managerRoles)
}

export function canReadWorkOrder(context: StoContext, workOrder: WorkOrderAccessRecord) {
  if (context.staffProfile.organizationId !== workOrder.organizationId) return false
  if (isOrganizationWideRole(context.role)) return true

  if (context.role === 'MECHANIC') {
    return (
      workOrder.createdByStaffProfileId === context.staffProfile.id ||
      workOrder.responsibleStaffProfileId === context.staffProfile.id
    )
  }

  if (context.role === 'MASTER') {
    if (!context.staffProfile.serviceCenterId) return true
    return workOrder.serviceCenterId === context.staffProfile.serviceCenterId
  }

  return false
}

export function requireCanReadWorkOrder(context: StoContext, workOrder: WorkOrderAccessRecord) {
  if (!canReadWorkOrder(context, workOrder)) {
    throw new AppError(403, 'FORBIDDEN', 'Work order is outside your STO scope')
  }
}

export function canEditWorkOrder(context: StoContext, workOrder: WorkOrderAccessRecord) {
  if (!canReadWorkOrder(context, workOrder)) return false
  return context.role !== 'MECHANIC'
}

export function requireCanEditWorkOrder(context: StoContext, workOrder: WorkOrderAccessRecord) {
  if (!canEditWorkOrder(context, workOrder)) {
    throw new AppError(403, 'FORBIDDEN', 'You cannot edit this work order')
  }
}

export function canChangeWorkOrderStatus(
  context: StoContext,
  workOrder: WorkOrderStatusAccessRecord,
  nextStatus: WorkOrderStatus,
) {
  return getAllowedWorkOrderStatusTargets(context, workOrder).includes(nextStatus)
}

export function getAllowedWorkOrderStatusTargets(
  context: StoContext,
  workOrder: WorkOrderStatusAccessRecord,
) {
  if (!canReadWorkOrder(context, workOrder)) return []

  const withoutCurrent = (statuses: readonly WorkOrderStatus[]) =>
    statuses.filter((status) => status !== workOrder.status)

  if (context.role === 'MECHANIC') {
    const isAssignedOrCreator =
      workOrder.createdByStaffProfileId === context.staffProfile.id ||
      workOrder.responsibleStaffProfileId === context.staffProfile.id
    return isAssignedOrCreator ? withoutCurrent(staffStatusTargets) : []
  }

  if (context.role === 'MASTER') {
    const isInServiceCenterScope =
      !context.staffProfile.serviceCenterId || workOrder.serviceCenterId === context.staffProfile.serviceCenterId
    return isInServiceCenterScope ? withoutCurrent(masterStatusTargets) : []
  }

  return isOrganizationWideRole(context.role) ? withoutCurrent(allStatusTargets) : []
}

export function requireCanChangeWorkOrderStatus(
  context: StoContext,
  workOrder: WorkOrderStatusAccessRecord,
  nextStatus: WorkOrderStatus,
) {
  if (!canChangeWorkOrderStatus(context, workOrder, nextStatus)) {
    throw new AppError(403, 'FORBIDDEN', 'You cannot change this work order status')
  }
}

export function workOrderScopeWhere(context: StoContext) {
  const organizationId = context.staffProfile.organizationId

  if (isOrganizationWideRole(context.role)) {
    return { organizationId }
  }

  if (context.role === 'MASTER') {
    return context.staffProfile.serviceCenterId
      ? { organizationId, serviceCenterId: context.staffProfile.serviceCenterId }
      : { organizationId }
  }

  return {
    organizationId,
    OR: [
      { createdByStaffProfileId: context.staffProfile.id },
      { responsibleStaffProfileId: context.staffProfile.id },
    ],
  }
}

function isOrganizationWideRole(role: StaffRole) {
  return organizationWideRoles.some((candidate) => candidate === role)
}
