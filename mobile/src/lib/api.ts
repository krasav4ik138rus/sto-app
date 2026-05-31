import {
  apiErrorSchema,
  attachmentDeleteResponseSchema,
  attachmentsListResponseSchema,
  appStoreOfferCodeRedemptionResponseSchema,
  authResponseSchema,
  appStoreReconcileRequestSchema,
  appStoreTransactionRequestSchema,
  changeWorkOrderStatusInputSchema,
  createAttachmentMetadataInputSchema,
  createCustomerInputSchema,
  createDiagnosticInputSchema,
  createRecommendationInputSchema,
  createVehicleInputSchema,
  createWorkOrderInputSchema,
  customerSchema,
  diagnosticSchema,
  diagnosticsListResponseSchema,
  iapEntitlementResponseSchema,
  iapMutationResponseSchema,
  inspectionActResponseSchema,
  listAttachmentsQuerySchema,
  listCustomersQuerySchema,
  listRecommendationsQuerySchema,
  listVehiclesQuerySchema,
  listWorkOrdersQuerySchema,
  loginRequestSchema,
  logoutRequestSchema,
  meResponseSchema,
  organizationSchema,
  pushMutationResponseSchema,
  refreshRequestSchema,
  refreshResponseSchema,
  registerPushTokenRequestSchema,
  registerRequestSchema,
  recommendationSchema,
  recommendationsListResponseSchema,
  serviceCenterSchema,
  socialAuthProviderSchema,
  socialAuthRequestSchema,
  staffProfileSchema,
  testPushNotificationRequestSchema,
  testPushNotificationResponseSchema,
  updateDiagnosticInputSchema,
  updateRecommendationInputSchema,
  updateWorkOrderInputSchema,
  unregisterPushTokenRequestSchema,
  upsertInspectionActInputSchema,
  patchInspectionActInputSchema,
  userSchema,
  vehicleSchema,
  workOrderDetailSchema,
  workOrderListItemSchema,
  workOrderSummarySchema,
  orderAttachmentSchema,
  type AuthResponse,
  type AppStoreReconcileRequest,
  type AppStoreTransactionRequest,
  type AppStoreOfferCodeRedemptionResponse,
  type ChangeWorkOrderStatusInput,
  type CreateAttachmentMetadataInput,
  type CreateCustomerInput,
  type CreateDiagnosticInput,
  type CreateRecommendationInput,
  type CreateVehicleInput,
  type CreateWorkOrderInput,
  type CustomerDto,
  type DiagnosticDto,
  type DiagnosticsListResponse,
  type IapEntitlementResponse,
  type IapMutationResponse,
  type InspectionActResponse,
  type ListAttachmentsQuery,
  type ListCustomersQuery,
  type ListRecommendationsQuery,
  type ListVehiclesQuery,
  type ListWorkOrdersQuery,
  type LoginRequest,
  type LogoutRequest,
  type MeResponse,
  type OrderAttachmentDto,
  type AttachmentsListResponse,
  type PatchInspectionActInput,
  type RecommendationDto,
  type RecommendationsListResponse,
  type ServiceCenterDto,
  type StaffRole,
  type UpdateDiagnosticInput,
  type UpdateRecommendationInput,
  type UpdateWorkOrderInput,
  type UpsertInspectionActInput,
  type VehicleDto,
  type WorkOrderDetailDto,
  type WorkOrderListItemDto,
  type WorkOrderSummaryDto,
  type PushMutationResponse,
  type RefreshResponse,
  type RegisterRequest,
  type RegisterPushTokenRequest,
  type SocialAuthProvider,
  type SocialAuthRequest,
  type TestPushNotificationRequest,
  type TestPushNotificationResponse,
  type UnregisterPushTokenRequest,
} from '@autoservice-app/contracts';
import { z } from 'zod';

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

type ApiClientOptions = {
  getAccessToken: () => string | null;
  setAccessToken: (accessToken: string | null) => void;
  getRefreshToken: () => Promise<string | null>;
  setRefreshToken: (refreshToken: string) => Promise<void>;
  clearRefreshToken: () => Promise<void>;
  onAuthExpired?: () => void | Promise<void>;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: FormData | unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

type AuthenticatedMutationOptions = {
  retryOnUnauthorized?: boolean;
};

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const stoMeResponseSchema = z.object({
  user: userSchema,
  staffProfile: staffProfileSchema,
  organization: organizationSchema,
  serviceCenter: serviceCenterSchema.nullable(),
  role: staffProfileSchema.shape.role,
});

const serviceCentersListResponseSchema = z.object({
  items: z.array(serviceCenterSchema),
});

const customersListResponseSchema = z.object({
  items: z.array(customerSchema),
  nextCursor: z.string().nullable(),
});

const vehiclesListResponseSchema = z.object({
  items: z.array(vehicleSchema),
  nextCursor: z.string().nullable(),
});

const workOrdersListResponseSchema = z.object({
  items: z.array(workOrderListItemSchema),
  nextCursor: z.string().nullable(),
});

export type StoMeResponse = z.infer<typeof stoMeResponseSchema>;
export type ServiceCentersListResponse = z.infer<typeof serviceCentersListResponseSchema>;
export type CustomersListResponse = z.infer<typeof customersListResponseSchema>;
export type VehiclesListResponse = z.infer<typeof vehiclesListResponseSchema>;
export type WorkOrdersListResponse = z.infer<typeof workOrdersListResponseSchema>;

export type UploadAttachmentFileInput = {
  file: {
    byteSize?: number | null;
    mimeType: string | null;
    name: string;
    uri: string;
  };
  metadata: Pick<
    CreateAttachmentMetadataInput,
    | 'caption'
    | 'contextFieldId'
    | 'contextLabel'
    | 'contextSectionId'
    | 'contextSide'
    | 'contextType'
    | 'diagnosticId'
    | 'inspectionActId'
    | 'recommendationId'
    | 'type'
    | 'visibility'
  >;
};

export class ApiClient {
  private refreshPromise: Promise<RefreshResponse> | null = null;

  constructor(private readonly options: ApiClientOptions) {}

  register(input: RegisterRequest): Promise<AuthResponse> {
    const payload = registerRequestSchema.parse(input);
    return this.request('/api/auth/register', authResponseSchema, {
      method: 'POST',
      body: payload,
      auth: false,
    });
  }

  login(input: LoginRequest): Promise<AuthResponse> {
    const payload = loginRequestSchema.parse(input);
    return this.request('/api/auth/login', authResponseSchema, {
      method: 'POST',
      body: payload,
      auth: false,
    });
  }

  socialAuth(provider: SocialAuthProvider, input: SocialAuthRequest): Promise<AuthResponse> {
    const parsedProvider = socialAuthProviderSchema.parse(provider);
    const payload = socialAuthRequestSchema.parse(input);
    return this.request(`/api/auth/social/${parsedProvider}`, authResponseSchema, {
      method: 'POST',
      body: payload,
      auth: false,
    });
  }

  async refresh(): Promise<RefreshResponse> {
    const refreshToken = await this.options.getRefreshToken();
    const payload = refreshRequestSchema.parse({ refreshToken: refreshToken ?? undefined });
    return this.request('/api/auth/refresh', refreshResponseSchema, {
      method: 'POST',
      body: payload,
      auth: false,
      retryOnUnauthorized: false,
    });
  }

  me(): Promise<MeResponse> {
    return this.request('/api/auth/me', meResponseSchema, {
      auth: true,
    });
  }

  iapEntitlement(): Promise<IapEntitlementResponse> {
    return this.request('/api/iap/entitlement', iapEntitlementResponseSchema, {
      auth: true,
    });
  }

  ingestAppStoreTransaction(input: AppStoreTransactionRequest): Promise<IapMutationResponse> {
    const payload = appStoreTransactionRequestSchema.parse(input);
    return this.request('/api/iap/app-store/transactions', iapMutationResponseSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  createAppStoreOfferCodeRedemption(): Promise<AppStoreOfferCodeRedemptionResponse> {
    return this.request('/api/iap/app-store/offer-code-redemption', appStoreOfferCodeRedemptionResponseSchema, {
      method: 'POST',
      auth: true,
    });
  }

  reconcileAppStoreTransactions(input: AppStoreReconcileRequest): Promise<IapMutationResponse> {
    const payload = appStoreReconcileRequestSchema.parse(input);
    return this.request('/api/iap/app-store/reconcile', iapMutationResponseSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  registerExpoPushToken(input: RegisterPushTokenRequest): Promise<PushMutationResponse> {
    const payload = registerPushTokenRequestSchema.parse(input);
    return this.request('/api/notifications/push-token', pushMutationResponseSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  unregisterExpoPushToken(
    input: UnregisterPushTokenRequest = {},
    options: AuthenticatedMutationOptions = {},
  ): Promise<PushMutationResponse> {
    const payload = unregisterPushTokenRequestSchema.parse(input);
    return this.request('/api/notifications/push-token/unregister', pushMutationResponseSchema, {
      method: 'POST',
      body: payload,
      auth: true,
      retryOnUnauthorized: options.retryOnUnauthorized,
    });
  }

  sendTestPushNotification(input: TestPushNotificationRequest = {}): Promise<TestPushNotificationResponse> {
    const payload = testPushNotificationRequestSchema.parse(input);
    return this.request('/api/notifications/test-push', testPushNotificationResponseSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  getStoMe(): Promise<StoMeResponse> {
    return this.request('/api/sto/me', stoMeResponseSchema, {
      auth: true,
    });
  }

  listServiceCenters(): Promise<ServiceCentersListResponse> {
    return this.request('/api/sto/service-centers', serviceCentersListResponseSchema, {
      auth: true,
    });
  }

  listCustomers(query: ListCustomersQuery = {}): Promise<CustomersListResponse> {
    const parsed = listCustomersQuerySchema.parse(query);
    return this.request(`/api/sto/customers${queryString(parsed)}`, customersListResponseSchema, {
      auth: true,
    });
  }

  createCustomer(input: CreateCustomerInput): Promise<CustomerDto> {
    const payload = createCustomerInputSchema.parse(input);
    return this.request('/api/sto/customers', customerSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  listVehicles(query: ListVehiclesQuery = {}): Promise<VehiclesListResponse> {
    const parsed = listVehiclesQuerySchema.parse(query);
    return this.request(`/api/sto/vehicles${queryString(parsed)}`, vehiclesListResponseSchema, {
      auth: true,
    });
  }

  createVehicle(input: CreateVehicleInput): Promise<VehicleDto> {
    const payload = createVehicleInputSchema.parse(input);
    return this.request('/api/sto/vehicles', vehicleSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  listWorkOrders(query: ListWorkOrdersQuery = {}): Promise<WorkOrdersListResponse> {
    const parsed = listWorkOrdersQuerySchema.parse(query);
    return this.request(`/api/sto/orders${queryString(parsed)}`, workOrdersListResponseSchema, {
      auth: true,
    });
  }

  getWorkOrder(id: string): Promise<WorkOrderDetailDto> {
    return this.request(`/api/sto/orders/${encodeURIComponent(id)}`, workOrderDetailSchema, {
      auth: true,
    });
  }

  createWorkOrder(input: CreateWorkOrderInput): Promise<WorkOrderDetailDto> {
    const payload = createWorkOrderInputSchema.parse(input);
    return this.request('/api/sto/orders', workOrderDetailSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  updateWorkOrder(id: string, input: UpdateWorkOrderInput): Promise<WorkOrderDetailDto> {
    const payload = updateWorkOrderInputSchema.parse(input);
    return this.request(`/api/sto/orders/${encodeURIComponent(id)}`, workOrderDetailSchema, {
      method: 'PATCH',
      body: payload,
      auth: true,
    });
  }

  changeWorkOrderStatus(id: string, input: ChangeWorkOrderStatusInput): Promise<WorkOrderDetailDto> {
    const payload = changeWorkOrderStatusInputSchema.parse(input);
    return this.request(`/api/sto/orders/${encodeURIComponent(id)}/status`, workOrderDetailSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  getInspection(orderId: string): Promise<InspectionActResponse> {
    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/inspection`, inspectionActResponseSchema, {
      auth: true,
    });
  }

  upsertInspection(orderId: string, input: UpsertInspectionActInput): Promise<InspectionActResponse> {
    const payload = upsertInspectionActInputSchema.parse(input);
    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/inspection`, inspectionActResponseSchema, {
      method: 'PUT',
      body: payload,
      auth: true,
    });
  }

  patchInspection(orderId: string, input: PatchInspectionActInput): Promise<InspectionActResponse> {
    const payload = patchInspectionActInputSchema.parse(input);
    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/inspection`, inspectionActResponseSchema, {
      method: 'PATCH',
      body: payload,
      auth: true,
    });
  }

  listDiagnostics(orderId: string): Promise<DiagnosticsListResponse> {
    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/diagnostics`, diagnosticsListResponseSchema, {
      auth: true,
    });
  }

  createDiagnostic(orderId: string, input: CreateDiagnosticInput): Promise<DiagnosticDto> {
    const payload = createDiagnosticInputSchema.parse(input);
    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/diagnostics`, diagnosticSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  getDiagnostic(diagnosticId: string): Promise<DiagnosticDto> {
    return this.request(`/api/sto/diagnostics/${encodeURIComponent(diagnosticId)}`, diagnosticSchema, {
      auth: true,
    });
  }

  updateDiagnostic(diagnosticId: string, input: UpdateDiagnosticInput): Promise<DiagnosticDto> {
    const payload = updateDiagnosticInputSchema.parse(input);
    return this.request(`/api/sto/diagnostics/${encodeURIComponent(diagnosticId)}`, diagnosticSchema, {
      method: 'PUT',
      body: payload,
      auth: true,
    });
  }

  listRecommendations(
    orderId: string,
    query: ListRecommendationsQuery = {},
  ): Promise<RecommendationsListResponse> {
    const parsed = listRecommendationsQuerySchema.parse(query);
    return this.request(
      `/api/sto/orders/${encodeURIComponent(orderId)}/recommendations${queryString(parsed)}`,
      recommendationsListResponseSchema,
      {
        auth: true,
      },
    );
  }

  createRecommendation(orderId: string, input: CreateRecommendationInput): Promise<RecommendationDto> {
    const payload = createRecommendationInputSchema.parse(input);
    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/recommendations`, recommendationSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  updateRecommendation(recommendationId: string, input: UpdateRecommendationInput): Promise<RecommendationDto> {
    const payload = updateRecommendationInputSchema.parse(input);
    return this.request(`/api/sto/recommendations/${encodeURIComponent(recommendationId)}`, recommendationSchema, {
      method: 'PATCH',
      body: payload,
      auth: true,
    });
  }

  listAttachments(orderId: string, query: ListAttachmentsQuery = {}): Promise<AttachmentsListResponse> {
    const parsed = listAttachmentsQuerySchema.parse(query);
    return this.request(
      `/api/sto/orders/${encodeURIComponent(orderId)}/attachments${queryString(parsed)}`,
      attachmentsListResponseSchema,
      {
        auth: true,
      },
    );
  }

  createAttachmentMetadata(orderId: string, input: CreateAttachmentMetadataInput): Promise<OrderAttachmentDto> {
    const payload = createAttachmentMetadataInputSchema.parse(input);
    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/attachments`, orderAttachmentSchema, {
      method: 'POST',
      body: payload,
      auth: true,
    });
  }

  uploadAttachmentFile(orderId: string, input: UploadAttachmentFileInput): Promise<OrderAttachmentDto> {
    const formData = new FormData();
    formData.append('file', {
      name: input.file.name,
      type: input.file.mimeType ?? 'application/octet-stream',
      uri: input.file.uri,
    } as unknown as Blob);
    formData.append('type', input.metadata.type);
    formData.append('visibility', input.metadata.visibility ?? 'INTERNAL');
    appendNullableFormValue(formData, 'caption', input.metadata.caption);
    appendNullableFormValue(formData, 'contextFieldId', input.metadata.contextFieldId);
    appendNullableFormValue(formData, 'contextLabel', input.metadata.contextLabel);
    appendNullableFormValue(formData, 'contextSectionId', input.metadata.contextSectionId);
    appendNullableFormValue(formData, 'contextSide', input.metadata.contextSide);
    appendNullableFormValue(formData, 'contextType', input.metadata.contextType);
    appendNullableFormValue(formData, 'diagnosticId', input.metadata.diagnosticId);
    appendNullableFormValue(formData, 'inspectionActId', input.metadata.inspectionActId);
    appendNullableFormValue(formData, 'recommendationId', input.metadata.recommendationId);

    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/attachments/upload`, orderAttachmentSchema, {
      method: 'POST',
      body: formData,
      auth: true,
    });
  }

  getAttachmentFileUrl(attachmentId: string) {
    return `${apiBaseUrl}/api/sto/attachments/${encodeURIComponent(attachmentId)}/file`;
  }

  getAttachmentFileHeaders() {
    const accessToken = this.options.getAccessToken();
    return {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'X-Client-Platform': 'mobile',
    };
  }

  async deleteAttachment(attachmentId: string): Promise<boolean> {
    const response = await this.request(`/api/sto/attachments/${encodeURIComponent(attachmentId)}`, attachmentDeleteResponseSchema, {
      method: 'DELETE',
      auth: true,
    });
    return response.ok;
  }

  getWorkOrderSummary(orderId: string): Promise<WorkOrderSummaryDto> {
    return this.request(`/api/sto/orders/${encodeURIComponent(orderId)}/summary`, workOrderSummarySchema, {
      auth: true,
    });
  }

  async logout(input: LogoutRequest = {}) {
    const storedRefreshToken = await this.options.getRefreshToken();
    const payload = logoutRequestSchema.parse({
      ...input,
      refreshToken: input.refreshToken ?? storedRefreshToken ?? undefined,
    });

    const response = await this.rawRequest('/api/auth/logout', {
      method: 'POST',
      body: payload,
      auth: false,
      retryOnUnauthorized: false,
    });
    return response.headers.get('X-Auth-Session-Revoked') === 'true';
  }

  private async request<TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
    options: RequestOptions,
  ): Promise<z.infer<TSchema>> {
    const response = await this.rawRequest(path, options);
    const data = await response.json();
    return schema.parse(data);
  }

  private async rawRequest(path: string, options: RequestOptions): Promise<Response> {
    const isFormData = options.body instanceof FormData;
    const body =
      options.body === undefined ? undefined : isFormData ? options.body : JSON.stringify(options.body);
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: this.headers(options),
      body: body as BodyInit | null | undefined,
    });

    if (response.status === 401 && options.auth && options.retryOnUnauthorized !== false) {
      const refreshed = await this.refreshOnce().catch(async (error: unknown) => {
        await this.expireSession();
        throw error;
      });
      this.options.setAccessToken(refreshed.accessToken);

      if (refreshed.refreshToken) {
        await this.options.setRefreshToken(refreshed.refreshToken);
      }

      return this.rawRequest(path, {
        ...options,
        retryOnUnauthorized: false,
      });
    }

    if (!response.ok) {
      throw await toApiError(response);
    }

    return response;
  }

  private refreshOnce() {
    this.refreshPromise ??= this.refresh().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async expireSession() {
    try {
      await this.options.onAuthExpired?.();
    } finally {
      this.options.setAccessToken(null);
      await this.options.clearRefreshToken();
    }
  }

  private headers(options: RequestOptions) {
    const isFormData = options.body instanceof FormData;
    const headers = new Headers({
      'X-Client-Platform': 'mobile',
    });

    if (options.body !== undefined && !isFormData) {
      headers.set('Content-Type', 'application/json');
    }

    if (options.auth) {
      const accessToken = this.options.getAccessToken();
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }

    return headers;
  }
}

export type { StaffRole, WorkOrderDetailDto, WorkOrderListItemDto };

async function toApiError(response: Response) {
  const fallbackMessage = `Request failed with status ${response.status}`;

  try {
    const parsed = apiErrorSchema.parse(await response.json());
    return new ApiRequestError(response.status, parsed.error.code, parsed.error.message);
  } catch {
    return new ApiRequestError(response.status, 'INTERNAL_ERROR', fallbackMessage);
  }
}

function queryString(query: Record<string, unknown>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
    } else {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function appendNullableFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') return;
  formData.append(key, String(value));
}
