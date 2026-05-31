import type { StaffRole, WorkOrderStatus } from '../generated/prisma/enums'
import { AppError } from '../http/errors'
import type { StoContext } from './sto-context'

type WorkOrderAccessRecord = {
  organizationId: string
  serviceCenterId: string | null
  responsibleStaffProfileId: string | null
  createdByStaffProfileId: string
}

const managerRoles = ['MASTER', 'DIRECTOR', 'ADMIN'] as const satisfies StaffRole[]
const organizationWideRoles = ['DIRECTOR', 'ADMIN'] as const satisfies StaffRole[]
const staffStatusRoles: readonly WorkOrderStatus[] = ['IN_PROGRESS', 'AWAITING_APPROVAL', 'CANCELLED']
const masterStatusRoles: readonly WorkOrderStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'APPROVED',
  'CANCELLED',
]

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
  workOrder: WorkOrderAccessRecord,
  nextStatus: WorkOrderStatus,
) {
  if (!canReadWorkOrder(context, workOrder)) return false

  if (context.role === 'MECHANIC') {
    return (
      staffStatusRoles.includes(nextStatus) &&
      (workOrder.createdByStaffProfileId === context.staffProfile.id ||
        workOrder.responsibleStaffProfileId === context.staffProfile.id)
    )
  }

  if (context.role === 'MASTER') {
    if (!masterStatusRoles.includes(nextStatus)) return false
    return !context.staffProfile.serviceCenterId || workOrder.serviceCenterId === context.staffProfile.serviceCenterId
  }

  return isOrganizationWideRole(context.role)
}

export function requireCanChangeWorkOrderStatus(
  context: StoContext,
  workOrder: WorkOrderAccessRecord,
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
