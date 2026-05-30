import type {
  AuditLogDto,
  CustomerDto,
  DiagnosticDto,
  InspectionActDto,
  OrderAttachmentDto,
  OrganizationDto,
  RecommendationDto,
  ServiceCenterDto,
  StaffProfileDto,
  VehicleDto,
  WorkOrderDetailDto,
  WorkOrderDto,
  WorkOrderListItemDto,
  WorkOrderStatusHistoryDto,
  WorkOrderSummaryDto,
} from '@autoservice-app/contracts'
import { diagnosticDataSchema, inspectionActDataSchema } from '@autoservice-app/contracts'

import {
  extractDiagnosticProblemItems,
  extractInspectionProblemItems,
  moneyToOutput,
} from './sto-json-forms'

type NullableDate = Date | null
type NullableDecimal = { toString(): string } | null
type JsonObject = Record<string, unknown>

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
    inspectionAct: Parameters<typeof toInspectionActDto>[0] | null
    diagnostics: Parameters<typeof toDiagnosticDto>[0][]
    recommendations: Parameters<typeof toRecommendationDto>[0][]
    attachments: Parameters<typeof toOrderAttachmentDto>[0][]
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
    inspectionAct: workOrder.inspectionAct ? toInspectionActDto(workOrder.inspectionAct) : null,
    diagnostics: workOrder.diagnostics.map(toDiagnosticDto),
    recommendations: workOrder.recommendations.map(toRecommendationDto),
    attachments: workOrder.attachments.map(toOrderAttachmentDto),
    summary: toWorkOrderSummaryDto(workOrder),
  }
}

export function toWorkOrderSummaryDto(workOrder: {
  id: string
  status: WorkOrderSummaryDto['status']
  inspectionAct: (Parameters<typeof toInspectionActDto>[0] & { dataJson?: unknown }) | null
  diagnostics: Array<Partial<Parameters<typeof toDiagnosticDto>[0]> & { id: string; dataJson?: unknown }>
  recommendations: Array<Partial<Parameters<typeof toRecommendationDto>[0]> & { status?: string }>
  attachments: unknown[]
  serviceCenter?: Parameters<typeof toServiceCenterDto>[0] | null
  customer?: Parameters<typeof toCustomerDto>[0] | null
  vehicle?: Parameters<typeof toVehicleDto>[0]
  organizationId?: string
  serviceCenterId?: string | null
  customerId?: string | null
  vehicleId?: string
  number?: string
  visitReason?: string | null
  mileage?: number | null
  responsibleStaffProfileId?: string | null
  createdByStaffProfileId?: string
  closedAt?: NullableDate
  createdAt?: Date
  updatedAt?: Date
}): WorkOrderSummaryDto {
  const recommendations = completeRecommendations(workOrder.recommendations)
  const diagnostics = completeDiagnostics(workOrder.diagnostics)
  const inspectionAct = completeInspectionAct(workOrder.inspectionAct)
  const recommendationTotals = recommendations.reduce(
    (totals, recommendation) => {
      totals.parts += moneyNumber(recommendation.partsPrice)
      totals.service += moneyNumber(recommendation.servicePrice)
      return totals
    },
    { parts: 0, service: 0 },
  )
  const diagnosticTotals = diagnostics.reduce(
    (totals, diagnostic) => {
      totals.parts += moneyNumber(diagnostic.partsTotal)
      totals.service += moneyNumber(diagnostic.serviceTotal)
      return totals
    },
    { parts: 0, service: 0 },
  )
  const totals =
    recommendations.length > 0
      ? recommendationTotals
      : diagnosticTotals

  return {
    workOrderId: workOrder.id,
    status: workOrder.status,
    inspectionCompleted: workOrder.inspectionAct !== null,
    diagnosticsCount: workOrder.diagnostics.length,
    recommendationsCount: workOrder.recommendations.length,
    approvedRecommendationsCount: workOrder.recommendations.filter((item) => item.status === 'APPROVED').length,
    attachmentsCount: workOrder.attachments.length,
    partsTotal: moneyToOutput(totals.parts),
    serviceTotal: moneyToOutput(totals.service),
    grandTotal: moneyToOutput(totals.parts + totals.service),
    ...(hasWorkOrderShape(workOrder) ? { order: toWorkOrderDto(workOrder) } : {}),
    ...(workOrder.serviceCenter !== undefined
      ? { serviceCenter: workOrder.serviceCenter ? toServiceCenterDto(workOrder.serviceCenter) : null }
      : {}),
    ...(workOrder.customer !== undefined
      ? { customer: workOrder.customer ? toCustomerDto(workOrder.customer) : null }
      : {}),
    ...(workOrder.vehicle ? { vehicle: toVehicleDto(workOrder.vehicle) } : {}),
    inspectionProblemItems: inspectionAct ? extractInspectionProblemItems(inspectionAct.dataJson) : [],
    diagnosticProblemItems: diagnostics.flatMap((diagnostic) =>
      extractDiagnosticProblemItems(diagnostic.id, diagnostic.dataJson),
    ),
    recommendations,
  }
}

export function toInspectionActDto(inspectionAct: {
  id: string
  organizationId: string
  workOrderId: string
  dataJson: unknown
  schemaVersion: number
  completedAt: NullableDate
  createdByStaffProfileId: string
  updatedByStaffProfileId: string | null
  createdAt: Date
  updatedAt: Date
}): InspectionActDto {
  return {
    ...inspectionAct,
    dataJson: inspectionActDataSchema.parse(inspectionAct.dataJson),
    completedAt: toIsoOrNull(inspectionAct.completedAt),
    createdAt: inspectionAct.createdAt.toISOString(),
    updatedAt: inspectionAct.updatedAt.toISOString(),
  }
}

export function toDiagnosticDto(diagnostic: {
  id: string
  organizationId: string
  workOrderId: string
  dataJson: unknown
  schemaVersion: number
  otherRecommendations: string | null
  alignmentComment: string | null
  partsTotal: NullableDecimal
  serviceTotal: NullableDecimal
  grandTotal: NullableDecimal
  executorStaffProfileId: string | null
  createdByStaffProfileId: string
  updatedByStaffProfileId: string | null
  createdAt: Date
  updatedAt: Date
}): DiagnosticDto {
  return {
    ...diagnostic,
    dataJson: diagnosticDataSchema.parse(diagnostic.dataJson),
    partsTotal: decimalToString(diagnostic.partsTotal),
    serviceTotal: decimalToString(diagnostic.serviceTotal),
    grandTotal: decimalToString(diagnostic.grandTotal),
    createdAt: diagnostic.createdAt.toISOString(),
    updatedAt: diagnostic.updatedAt.toISOString(),
  }
}

export function toRecommendationDto(recommendation: {
  id: string
  organizationId: string
  workOrderId: string
  diagnosticId: string | null
  inspectionActId: string | null
  text: string
  status: RecommendationDto['status']
  partsPrice: NullableDecimal
  servicePrice: NullableDecimal
  totalPrice: NullableDecimal
  createdByStaffProfileId: string
  updatedByStaffProfileId: string | null
  createdAt: Date
  updatedAt: Date
}): RecommendationDto {
  return {
    ...recommendation,
    partsPrice: decimalToString(recommendation.partsPrice),
    servicePrice: decimalToString(recommendation.servicePrice),
    totalPrice: decimalToString(recommendation.totalPrice),
    createdAt: recommendation.createdAt.toISOString(),
    updatedAt: recommendation.updatedAt.toISOString(),
  }
}

export function toOrderAttachmentDto(attachment: {
  id: string
  organizationId: string
  workOrderId: string
  inspectionActId: string | null
  diagnosticId: string | null
  recommendationId: string | null
  type: OrderAttachmentDto['type']
  visibility: OrderAttachmentDto['visibility']
  storageKey: string
  fileUrl: string | null
  originalFilename: string | null
  mimeType: string | null
  byteSize: number | null
  caption: string | null
  createdByStaffProfileId: string
  createdAt: Date
  deletedAt: NullableDate
}): OrderAttachmentDto {
  return {
    ...attachment,
    createdAt: attachment.createdAt.toISOString(),
    deletedAt: toIsoOrNull(attachment.deletedAt),
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

function completeRecommendations(
  recommendations: Array<Partial<Parameters<typeof toRecommendationDto>[0]> & { status?: string }>,
) {
  return recommendations.filter((item): item is Parameters<typeof toRecommendationDto>[0] => {
    return (
      typeof item.id === 'string' &&
      typeof item.organizationId === 'string' &&
      typeof item.workOrderId === 'string' &&
      typeof item.text === 'string' &&
      isRecommendationStatus(item.status) &&
      item.createdAt instanceof Date &&
      item.updatedAt instanceof Date
    )
  }).map(toRecommendationDto)
}

function completeDiagnostics(
  diagnostics: Array<Partial<Parameters<typeof toDiagnosticDto>[0]> & { id: string; dataJson?: unknown }>,
) {
  return diagnostics.filter((item): item is Parameters<typeof toDiagnosticDto>[0] => {
    return (
      typeof item.id === 'string' &&
      typeof item.organizationId === 'string' &&
      typeof item.workOrderId === 'string' &&
      item.dataJson !== undefined &&
      typeof item.schemaVersion === 'number' &&
      item.createdAt instanceof Date &&
      item.updatedAt instanceof Date
    )
  }).map(toDiagnosticDto)
}

function completeInspectionAct(
  inspectionAct: (Parameters<typeof toInspectionActDto>[0] & { dataJson?: unknown }) | null,
) {
  if (!inspectionAct) return null
  return toInspectionActDto(inspectionAct)
}

function hasWorkOrderShape(
  value: Parameters<typeof toWorkOrderSummaryDto>[0],
): value is Parameters<typeof toWorkOrderDto>[0] & Parameters<typeof toWorkOrderSummaryDto>[0] {
  return (
    typeof value.organizationId === 'string' &&
    typeof value.vehicleId === 'string' &&
    typeof value.number === 'string' &&
    typeof value.createdByStaffProfileId === 'string' &&
    value.createdAt instanceof Date &&
    value.updatedAt instanceof Date
  )
}

function isRecommendationStatus(value: unknown): value is RecommendationDto['status'] {
  return value === 'SUGGESTED' || value === 'APPROVED' || value === 'DECLINED' || value === 'DONE'
}

function moneyNumber(value: string | null) {
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
