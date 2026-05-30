import { z } from 'zod'

export const staffRoleSchema = z.enum(['MECHANIC', 'MASTER', 'DIRECTOR', 'ADMIN'])

export const workOrderStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'APPROVED',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
])

export const recommendationStatusSchema = z.enum(['SUGGESTED', 'APPROVED', 'DECLINED', 'DONE'])

export const attachmentTypeSchema = z.enum(['PHOTO', 'DOCUMENT', 'VIDEO'])

export const attachmentVisibilitySchema = z.enum(['INTERNAL', 'CUSTOMER_VISIBLE'])

export const inspectionConditionSchema = z.enum(['ok', 'attention', 'urgent'])

export const diagnosticStatusSchema = z.enum(['ok', 'not_ok', 'recommend_service'])

export const stoFieldTypeSchema = z.enum([
  'text',
  'text_multiline',
  'number',
  'choice',
  'condition3',
  'money',
])

export const diagnosticSideSchema = z.enum(['none', 'both'])

export const moneyInputSchema = z.union([
  z.number().finite(),
  z.string().trim().regex(/^-?\d+(\.\d{1,2})?$/, 'Expected decimal money value'),
])

export const moneyOutputSchema = z.string().regex(/^-?\d+(\.\d+)?$/).nullable()

const idSchema = z.string()
const dateTimeSchema = z.string().datetime()
const nullableStringSchema = z.string().nullable()
const nullableNumberSchema = z.number().int().nullable()
const optionalNullableStringSchema = z.string().nullable().optional()
const optionalNullableMoneyInputSchema = moneyInputSchema.nullable().optional()

export const inspectionActFieldValueSchema = z.union([
  inspectionConditionSchema,
  z.string(),
  z.number(),
  z.null(),
])

export const inspectionActDataSchema = z.object({
  schemaVersion: z.number().int().positive().default(1),
  values: z.record(z.string(), inspectionActFieldValueSchema),
})

export const diagnosticSideValueSchema = z.object({
  status: diagnosticStatusSchema.nullable(),
  partsPrice: optionalNullableMoneyInputSchema,
  servicePrice: optionalNullableMoneyInputSchema,
  comment: optionalNullableStringSchema,
})

export const diagnosticItemValueSchema = z.union([
  diagnosticSideValueSchema,
  z.object({
    left: diagnosticSideValueSchema,
    right: diagnosticSideValueSchema,
  }),
])

export const diagnosticDataSchema = z.object({
  schemaVersion: z.number().int().positive().default(1),
  values: z.record(z.string(), diagnosticItemValueSchema),
  totals: z
    .object({
      otherRecommendations: optionalNullableStringSchema,
      alignmentComment: optionalNullableStringSchema,
      partsTotal: optionalNullableMoneyInputSchema,
      serviceTotal: optionalNullableMoneyInputSchema,
      grandTotal: optionalNullableMoneyInputSchema,
      executorName: optionalNullableStringSchema,
    })
    .optional(),
})

export const organizationSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
  isActive: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const serviceCenterSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  name: z.string(),
  address: nullableStringSchema,
  phone: nullableStringSchema,
  isActive: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const staffProfileSchema = z.object({
  id: idSchema,
  userId: idSchema,
  organizationId: idSchema,
  serviceCenterId: nullableStringSchema,
  fullName: nullableStringSchema,
  phone: nullableStringSchema,
  role: staffRoleSchema,
  isActive: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const customerSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  name: nullableStringSchema,
  phone: nullableStringSchema,
  email: nullableStringSchema,
  notes: nullableStringSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const vehicleSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  customerId: nullableStringSchema,
  brand: nullableStringSchema,
  model: nullableStringSchema,
  brandModel: z.string(),
  vin: nullableStringSchema,
  plate: nullableStringSchema,
  engineSpec: nullableStringSchema,
  year: nullableNumberSchema,
  currentMileage: nullableNumberSchema,
  notes: nullableStringSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const workOrderSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  serviceCenterId: nullableStringSchema,
  customerId: nullableStringSchema,
  vehicleId: idSchema,
  number: z.string(),
  status: workOrderStatusSchema,
  visitReason: nullableStringSchema,
  mileage: nullableNumberSchema,
  responsibleStaffProfileId: nullableStringSchema,
  createdByStaffProfileId: idSchema,
  closedAt: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const workOrderStatusHistorySchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  workOrderId: idSchema,
  fromStatus: workOrderStatusSchema.nullable(),
  toStatus: workOrderStatusSchema,
  comment: nullableStringSchema,
  changedByStaffProfileId: idSchema,
  createdAt: dateTimeSchema,
})

export const inspectionActSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  workOrderId: idSchema,
  dataJson: inspectionActDataSchema,
  schemaVersion: z.number().int(),
  completedAt: dateTimeSchema.nullable(),
  createdByStaffProfileId: idSchema,
  updatedByStaffProfileId: nullableStringSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const diagnosticSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  workOrderId: idSchema,
  dataJson: diagnosticDataSchema,
  schemaVersion: z.number().int(),
  otherRecommendations: nullableStringSchema,
  alignmentComment: nullableStringSchema,
  partsTotal: moneyOutputSchema,
  serviceTotal: moneyOutputSchema,
  grandTotal: moneyOutputSchema,
  executorStaffProfileId: nullableStringSchema,
  createdByStaffProfileId: idSchema,
  updatedByStaffProfileId: nullableStringSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const recommendationSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  workOrderId: idSchema,
  diagnosticId: nullableStringSchema,
  inspectionActId: nullableStringSchema,
  text: z.string(),
  status: recommendationStatusSchema,
  partsPrice: moneyOutputSchema,
  servicePrice: moneyOutputSchema,
  totalPrice: moneyOutputSchema,
  createdByStaffProfileId: idSchema,
  updatedByStaffProfileId: nullableStringSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export const orderAttachmentSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  workOrderId: idSchema,
  inspectionActId: nullableStringSchema,
  diagnosticId: nullableStringSchema,
  recommendationId: nullableStringSchema,
  type: attachmentTypeSchema,
  visibility: attachmentVisibilitySchema,
  storageKey: z.string(),
  fileUrl: nullableStringSchema,
  originalFilename: nullableStringSchema,
  mimeType: nullableStringSchema,
  byteSize: nullableNumberSchema,
  caption: nullableStringSchema,
  createdByStaffProfileId: idSchema,
  createdAt: dateTimeSchema,
  deletedAt: dateTimeSchema.nullable(),
})

export const auditLogSchema = z.object({
  id: idSchema,
  organizationId: nullableStringSchema,
  staffProfileId: nullableStringSchema,
  entityType: z.string(),
  entityId: z.string(),
  action: z.string(),
  payloadJson: z.record(z.string(), z.unknown()).nullable(),
  createdAt: dateTimeSchema,
})

export const workOrderListItemSchema = workOrderSchema.extend({
  serviceCenter: serviceCenterSchema.nullable(),
  customer: customerSchema.nullable(),
  vehicle: vehicleSchema,
  responsibleStaffProfile: staffProfileSchema.nullable(),
})

export const workOrderSummarySchema = z.object({
  workOrderId: idSchema,
  status: workOrderStatusSchema,
  inspectionCompleted: z.boolean(),
  diagnosticsCount: z.number().int().nonnegative(),
  recommendationsCount: z.number().int().nonnegative(),
  approvedRecommendationsCount: z.number().int().nonnegative(),
  attachmentsCount: z.number().int().nonnegative(),
  partsTotal: moneyOutputSchema,
  serviceTotal: moneyOutputSchema,
  grandTotal: moneyOutputSchema,
})

export const workOrderDetailSchema = workOrderSchema.extend({
  organization: organizationSchema,
  serviceCenter: serviceCenterSchema.nullable(),
  customer: customerSchema.nullable(),
  vehicle: vehicleSchema,
  responsibleStaffProfile: staffProfileSchema.nullable(),
  createdByStaffProfile: staffProfileSchema,
  statusHistory: z.array(workOrderStatusHistorySchema),
  inspectionAct: inspectionActSchema.nullable(),
  diagnostics: z.array(diagnosticSchema),
  recommendations: z.array(recommendationSchema),
  attachments: z.array(orderAttachmentSchema),
  summary: workOrderSummarySchema,
})

export const createCustomerInputSchema = z.object({
  name: z.string().trim().min(1).max(160).nullable().optional(),
  phone: z.string().trim().min(1).max(40).nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
})

export const updateCustomerInputSchema = createCustomerInputSchema.partial()

export const createVehicleInputSchema = z.object({
  customerId: idSchema.nullable().optional(),
  brand: z.string().trim().max(80).nullable().optional(),
  model: z.string().trim().max(80).nullable().optional(),
  brandModel: z.string().trim().min(1).max(180),
  vin: z.string().trim().max(32).nullable().optional(),
  plate: z.string().trim().max(32).nullable().optional(),
  engineSpec: z.string().trim().max(120).nullable().optional(),
  year: z.number().int().min(1886).max(2200).nullable().optional(),
  currentMileage: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
})

export const updateVehicleInputSchema = createVehicleInputSchema.partial()

const createWorkOrderCustomerInputSchema = createCustomerInputSchema

const createWorkOrderVehicleInputSchema = createVehicleInputSchema.omit({ customerId: true })

export const createWorkOrderInputSchema = z
  .object({
    serviceCenterId: idSchema.nullable().optional(),
    customerId: idSchema.nullable().optional(),
    customer: createWorkOrderCustomerInputSchema.optional(),
    vehicleId: idSchema.optional(),
    vehicle: createWorkOrderVehicleInputSchema.optional(),
    number: z.string().trim().min(1).max(80).optional(),
    visitReason: z.string().trim().max(4000).nullable().optional(),
    mileage: z.number().int().nonnegative().nullable().optional(),
    responsibleStaffProfileId: idSchema.nullable().optional(),
  })
  .refine((value) => value.vehicleId || value.vehicle, {
    message: 'Provide vehicleId or nested vehicle data',
    path: ['vehicleId'],
  })

export const updateWorkOrderInputSchema = z.object({
  serviceCenterId: idSchema.nullable().optional(),
  customerId: idSchema.nullable().optional(),
  vehicleId: idSchema.optional(),
  visitReason: z.string().trim().max(4000).nullable().optional(),
  mileage: z.number().int().nonnegative().nullable().optional(),
  responsibleStaffProfileId: idSchema.nullable().optional(),
})

export const changeWorkOrderStatusInputSchema = z.object({
  status: workOrderStatusSchema,
  comment: z.string().trim().max(2000).nullable().optional(),
})

export const upsertInspectionActInputSchema = z.object({
  dataJson: inspectionActDataSchema,
  completedAt: dateTimeSchema.nullable().optional(),
})

export const patchInspectionActInputSchema = z.object({
  dataJson: inspectionActDataSchema.optional(),
  completedAt: dateTimeSchema.nullable().optional(),
})

export const createDiagnosticInputSchema = z.object({
  dataJson: diagnosticDataSchema,
  otherRecommendations: z.string().trim().max(4000).nullable().optional(),
  alignmentComment: z.string().trim().max(2000).nullable().optional(),
  partsTotal: optionalNullableMoneyInputSchema,
  serviceTotal: optionalNullableMoneyInputSchema,
  grandTotal: optionalNullableMoneyInputSchema,
  executorStaffProfileId: idSchema.nullable().optional(),
})

export const updateDiagnosticInputSchema = createDiagnosticInputSchema.partial()

export const createRecommendationInputSchema = z.object({
  workOrderId: idSchema.optional(),
  diagnosticId: idSchema.nullable().optional(),
  inspectionActId: idSchema.nullable().optional(),
  text: z.string().trim().min(1).max(4000),
  status: recommendationStatusSchema.default('SUGGESTED'),
  partsPrice: optionalNullableMoneyInputSchema,
  servicePrice: optionalNullableMoneyInputSchema,
  totalPrice: optionalNullableMoneyInputSchema,
})

export const updateRecommendationInputSchema = z.object({
  diagnosticId: idSchema.nullable().optional(),
  inspectionActId: idSchema.nullable().optional(),
  text: z.string().trim().min(1).max(4000).optional(),
  status: recommendationStatusSchema.optional(),
  partsPrice: optionalNullableMoneyInputSchema,
  servicePrice: optionalNullableMoneyInputSchema,
  totalPrice: optionalNullableMoneyInputSchema,
})

export const createAttachmentMetadataInputSchema = z.object({
  workOrderId: idSchema.optional(),
  inspectionActId: idSchema.nullable().optional(),
  diagnosticId: idSchema.nullable().optional(),
  recommendationId: idSchema.nullable().optional(),
  type: attachmentTypeSchema,
  visibility: attachmentVisibilitySchema.default('INTERNAL'),
  storageKey: z.string().trim().min(1).max(1024),
  fileUrl: z.string().trim().url().nullable().optional(),
  originalFilename: z.string().trim().max(255).nullable().optional(),
  mimeType: z.string().trim().max(120).nullable().optional(),
  byteSize: z.number().int().nonnegative().nullable().optional(),
  caption: z.string().trim().max(1000).nullable().optional(),
})

export const updateAttachmentMetadataInputSchema = z.object({
  visibility: attachmentVisibilitySchema.optional(),
  fileUrl: z.string().trim().url().nullable().optional(),
  originalFilename: z.string().trim().max(255).nullable().optional(),
  mimeType: z.string().trim().max(120).nullable().optional(),
  byteSize: z.number().int().nonnegative().nullable().optional(),
  caption: z.string().trim().max(1000).nullable().optional(),
  deletedAt: dateTimeSchema.nullable().optional(),
})

export const createStaffProfileInputSchema = z.object({
  userId: idSchema,
  organizationId: idSchema.optional(),
  serviceCenterId: idSchema.nullable().optional(),
  fullName: z.string().trim().max(160).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  role: staffRoleSchema,
  isActive: z.boolean().optional(),
})

export const updateStaffProfileInputSchema = z.object({
  serviceCenterId: idSchema.nullable().optional(),
  fullName: z.string().trim().max(160).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  role: staffRoleSchema.optional(),
  isActive: z.boolean().optional(),
})

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
})

export const listWorkOrdersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  status: z.union([workOrderStatusSchema, z.array(workOrderStatusSchema)]).optional(),
  organizationId: idSchema.optional(),
  serviceCenterId: idSchema.optional(),
  customerId: idSchema.optional(),
  vehicleId: idSchema.optional(),
  responsibleStaffProfileId: idSchema.optional(),
  sort: z.enum(['created_desc', 'created_asc', 'updated_desc']).optional(),
})

export const listCustomersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  organizationId: idSchema.optional(),
  sort: z.enum(['created_desc', 'created_asc', 'name_asc']).optional(),
})

export const listVehiclesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  organizationId: idSchema.optional(),
  customerId: idSchema.optional(),
  sort: z.enum(['created_desc', 'created_asc', 'brand_model_asc']).optional(),
})

export const listRecommendationsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  status: z.union([recommendationStatusSchema, z.array(recommendationStatusSchema)]).optional(),
  organizationId: idSchema.optional(),
  workOrderId: idSchema.optional(),
  sort: z.enum(['created_desc', 'created_asc', 'updated_desc']).optional(),
})

export const listAttachmentsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  type: z.union([attachmentTypeSchema, z.array(attachmentTypeSchema)]).optional(),
  visibility: attachmentVisibilitySchema.optional(),
  organizationId: idSchema.optional(),
  workOrderId: idSchema.optional(),
  sort: z.enum(['created_desc', 'created_asc']).optional(),
})

export const listStaffProfilesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  role: z.union([staffRoleSchema, z.array(staffRoleSchema)]).optional(),
  organizationId: idSchema.optional(),
  serviceCenterId: idSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  sort: z.enum(['created_desc', 'created_asc', 'name_asc']).optional(),
})

export type StaffRole = z.infer<typeof staffRoleSchema>
export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>
export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>
export type AttachmentType = z.infer<typeof attachmentTypeSchema>
export type AttachmentVisibility = z.infer<typeof attachmentVisibilitySchema>
export type InspectionCondition = z.infer<typeof inspectionConditionSchema>
export type DiagnosticStatus = z.infer<typeof diagnosticStatusSchema>
export type StoFieldType = z.infer<typeof stoFieldTypeSchema>
export type DiagnosticSide = z.infer<typeof diagnosticSideSchema>

export type MoneyInput = z.input<typeof moneyInputSchema>
export type MoneyOutput = z.infer<typeof moneyOutputSchema>
export type InspectionActData = z.infer<typeof inspectionActDataSchema>
export type DiagnosticData = z.infer<typeof diagnosticDataSchema>

export type OrganizationDto = z.infer<typeof organizationSchema>
export type ServiceCenterDto = z.infer<typeof serviceCenterSchema>
export type StaffProfileDto = z.infer<typeof staffProfileSchema>
export type CustomerDto = z.infer<typeof customerSchema>
export type VehicleDto = z.infer<typeof vehicleSchema>
export type WorkOrderDto = z.infer<typeof workOrderSchema>
export type WorkOrderListItemDto = z.infer<typeof workOrderListItemSchema>
export type WorkOrderDetailDto = z.infer<typeof workOrderDetailSchema>
export type WorkOrderStatusHistoryDto = z.infer<typeof workOrderStatusHistorySchema>
export type InspectionActDto = z.infer<typeof inspectionActSchema>
export type DiagnosticDto = z.infer<typeof diagnosticSchema>
export type RecommendationDto = z.infer<typeof recommendationSchema>
export type OrderAttachmentDto = z.infer<typeof orderAttachmentSchema>
export type AuditLogDto = z.infer<typeof auditLogSchema>
export type WorkOrderSummaryDto = z.infer<typeof workOrderSummarySchema>

export type CreateCustomerInput = z.input<typeof createCustomerInputSchema>
export type UpdateCustomerInput = z.input<typeof updateCustomerInputSchema>
export type CreateVehicleInput = z.input<typeof createVehicleInputSchema>
export type UpdateVehicleInput = z.input<typeof updateVehicleInputSchema>
export type CreateWorkOrderInput = z.input<typeof createWorkOrderInputSchema>
export type UpdateWorkOrderInput = z.input<typeof updateWorkOrderInputSchema>
export type ChangeWorkOrderStatusInput = z.input<typeof changeWorkOrderStatusInputSchema>
export type UpsertInspectionActInput = z.input<typeof upsertInspectionActInputSchema>
export type PatchInspectionActInput = z.input<typeof patchInspectionActInputSchema>
export type CreateDiagnosticInput = z.input<typeof createDiagnosticInputSchema>
export type UpdateDiagnosticInput = z.input<typeof updateDiagnosticInputSchema>
export type CreateRecommendationInput = z.input<typeof createRecommendationInputSchema>
export type UpdateRecommendationInput = z.input<typeof updateRecommendationInputSchema>
export type CreateAttachmentMetadataInput = z.input<typeof createAttachmentMetadataInputSchema>
export type UpdateAttachmentMetadataInput = z.input<typeof updateAttachmentMetadataInputSchema>
export type CreateStaffProfileInput = z.input<typeof createStaffProfileInputSchema>
export type UpdateStaffProfileInput = z.input<typeof updateStaffProfileInputSchema>

export type ListWorkOrdersQuery = z.input<typeof listWorkOrdersQuerySchema>
export type ListCustomersQuery = z.input<typeof listCustomersQuerySchema>
export type ListVehiclesQuery = z.input<typeof listVehiclesQuerySchema>
export type ListRecommendationsQuery = z.input<typeof listRecommendationsQuerySchema>
export type ListAttachmentsQuery = z.input<typeof listAttachmentsQuerySchema>
export type ListStaffProfilesQuery = z.input<typeof listStaffProfilesQuerySchema>
