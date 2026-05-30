import type {
  AuditLogDto,
  CustomerDto,
  OrganizationDto,
  ServiceCenterDto,
  StaffProfileDto,
  VehicleDto,
  WorkOrderDetailDto,
  WorkOrderDto,
  WorkOrderListItemDto,
  WorkOrderStatusHistoryDto,
  WorkOrderSummaryDto,
} from '@autoservice-app/contracts'

type NullableDate = Date | null
type NullableDecimal = { toString(): string } | null

export function toOrganizationDto(organization: {
  id: string
  name: string
  slug: string
  timezone: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): OrganizationDto {
  return {
    ...organization,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  }
}

export function toServiceCenterDto(serviceCenter: {
  id: string
  organizationId: string
  name: string
  address: string | null
  phone: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): ServiceCenterDto {
  return {
    ...serviceCenter,
    createdAt: serviceCenter.createdAt.toISOString(),
    updatedAt: serviceCenter.updatedAt.toISOString(),
  }
}

export function toStaffProfileDto(staffProfile: {
  id: string
  userId: string
  organizationId: string
  serviceCenterId: string | null
  fullName: string | null
  phone: string | null
  role: StaffProfileDto['role']
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): StaffProfileDto {
  return {
    ...staffProfile,
    createdAt: staffProfile.createdAt.toISOString(),
    updatedAt: staffProfile.updatedAt.toISOString(),
  }
}

export function toCustomerDto(customer: {
  id: string
  organizationId: string
  name: string | null
  phone: string | null
  email: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}): CustomerDto {
  return {
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  }
}

export function toVehicleDto(vehicle: {
  id: string
  organizationId: string
  customerId: string | null
  brand: string | null
  model: string | null
  brandModel: string
  vin: string | null
  plate: string | null
  engineSpec: string | null
  year: number | null
  currentMileage: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}): VehicleDto {
  return {
    ...vehicle,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  }
}

export function toWorkOrderDto(workOrder: {
  id: string
  organizationId: string
  serviceCenterId: string | null
  customerId: string | null
  vehicleId: string
  number: string
  status: WorkOrderDto['status']
  visitReason: string | null
  mileage: number | null
  responsibleStaffProfileId: string | null
  createdByStaffProfileId: string
  closedAt: NullableDate
  createdAt: Date
  updatedAt: Date
}): WorkOrderDto {
  return {
    ...workOrder,
    closedAt: toIsoOrNull(workOrder.closedAt),
    createdAt: workOrder.createdAt.toISOString(),
    updatedAt: workOrder.updatedAt.toISOString(),
  }
}

export function toWorkOrderStatusHistoryDto(history: {
  id: string
  organizationId: string
  workOrderId: string
  fromStatus: WorkOrderStatusHistoryDto['fromStatus']
  toStatus: WorkOrderStatusHistoryDto['toStatus']
  comment: string | null
  changedByStaffProfileId: string
  createdAt: Date
}): WorkOrderStatusHistoryDto {
  return {
    ...history,
    createdAt: history.createdAt.toISOString(),
  }
}

export function toWorkOrderListItemDto(
  workOrder: Parameters<typeof toWorkOrderDto>[0] & {
    serviceCenter: Parameters<typeof toServiceCenterDto>[0] | null
    customer: Parameters<typeof toCustomerDto>[0] | null
    vehicle: Parameters<typeof toVehicleDto>[0]
    responsibleStaffProfile: Parameters<typeof toStaffProfileDto>[0] | null
  },
): WorkOrderListItemDto {
  return {
    ...toWorkOrderDto(workOrder),
    serviceCenter: workOrder.serviceCenter ? toServiceCenterDto(workOrder.serviceCenter) : null,
    customer: workOrder.customer ? toCustomerDto(workOrder.customer) : null,
    vehicle: toVehicleDto(workOrder.vehicle),
    responsibleStaffProfile: workOrder.responsibleStaffProfile
      ? toStaffProfileDto(workOrder.responsibleStaffProfile)
      : null,
  }
}

export function toWorkOrderDetailDto(
  workOrder: Parameters<typeof toWorkOrderDto>[0] & {
    organization: Parameters<typeof toOrganizationDto>[0]
    serviceCenter: Parameters<typeof toServiceCenterDto>[0] | null
    customer: Parameters<typeof toCustomerDto>[0] | null
    vehicle: Parameters<typeof toVehicleDto>[0]
    responsibleStaffProfile: Parameters<typeof toStaffProfileDto>[0] | null
    createdByStaffProfile: Parameters<typeof toStaffProfileDto>[0]
    statusHistory: Parameters<typeof toWorkOrderStatusHistoryDto>[0][]
    inspectionAct: { id: string } | null
    diagnostics: unknown[]
    recommendations: unknown[]
    attachments: unknown[]
  },
): WorkOrderDetailDto {
  return {
    ...toWorkOrderDto(workOrder),
    organization: toOrganizationDto(workOrder.organization),
    serviceCenter: workOrder.serviceCenter ? toServiceCenterDto(workOrder.serviceCenter) : null,
    customer: workOrder.customer ? toCustomerDto(workOrder.customer) : null,
    vehicle: toVehicleDto(workOrder.vehicle),
    responsibleStaffProfile: workOrder.responsibleStaffProfile
      ? toStaffProfileDto(workOrder.responsibleStaffProfile)
      : null,
    createdByStaffProfile: toStaffProfileDto(workOrder.createdByStaffProfile),
    statusHistory: workOrder.statusHistory.map(toWorkOrderStatusHistoryDto),
    inspectionAct: null,
    diagnostics: [],
    recommendations: [],
    attachments: [],
    summary: toWorkOrderSummaryDto(workOrder),
  }
}

export function toWorkOrderSummaryDto(workOrder: {
  id: string
  status: WorkOrderSummaryDto['status']
  inspectionAct: { id: string } | null
  diagnostics: unknown[]
  recommendations: unknown[]
  attachments: unknown[]
}): WorkOrderSummaryDto {
  return {
    workOrderId: workOrder.id,
    status: workOrder.status,
    inspectionCompleted: workOrder.inspectionAct !== null,
    diagnosticsCount: workOrder.diagnostics.length,
    recommendationsCount: workOrder.recommendations.length,
    approvedRecommendationsCount: 0,
    attachmentsCount: workOrder.attachments.length,
    partsTotal: null,
    serviceTotal: null,
    grandTotal: null,
  }
}

export function toAuditLogDto(auditLog: {
  id: string
  organizationId: string | null
  staffProfileId: string | null
  entityType: string
  entityId: string
  action: string
  payloadJson: Record<string, unknown> | null
  createdAt: Date
}): AuditLogDto {
  return {
    ...auditLog,
    createdAt: auditLog.createdAt.toISOString(),
  }
}

export function decimalToString(value: NullableDecimal) {
  return value?.toString() ?? null
}

function toIsoOrNull(value: NullableDate) {
  return value ? value.toISOString() : null
}
