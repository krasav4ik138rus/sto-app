import {
  apiErrorSchema,
  appStoreOfferCodeRedemptionResponseSchema,
  authResponseSchema,
  appStoreReconcileRequestSchema,
  appStoreTransactionRequestSchema,
  changeWorkOrderStatusInputSchema,
  createCustomerInputSchema,
  createVehicleInputSchema,
  createWorkOrderInputSchema,
  customerSchema,
  iapEntitlementResponseSchema,
  iapMutationResponseSchema,
  listCustomersQuerySchema,
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
  serviceCenterSchema,
  socialAuthProviderSchema,
  socialAuthRequestSchema,
  staffProfileSchema,
  testPushNotificationRequestSchema,
  testPushNotificationResponseSchema,
  updateWorkOrderInputSchema,
  unregisterPushTokenRequestSchema,
  userSchema,
  vehicleSchema,
  workOrderDetailSchema,
  workOrderListItemSchema,
  type AuthResponse,
  type AppStoreReconcileRequest,
  type AppStoreTransactionRequest,
  type AppStoreOfferCodeRedemptionResponse,
  type ChangeWorkOrderStatusInput,
  type CreateCustomerInput,
  type CreateVehicleInput,
  type CreateWorkOrderInput,
  type CustomerDto,
  type IapEntitlementResponse,
  type IapMutationResponse,
  type ListCustomersQuery,
  type ListVehiclesQuery,
  type ListWorkOrdersQuery,
  type LoginRequest,
  type LogoutRequest,
  type MeResponse,
  type ServiceCenterDto,
  type StaffRole,
  type UpdateWorkOrderInput,
  type VehicleDto,
  type WorkOrderDetailDto,
  type WorkOrderListItemDto,
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
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
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
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: this.headers(options),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
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
    const headers = new Headers({
      'X-Client-Platform': 'mobile',
    });

    if (options.body !== undefined) {
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
