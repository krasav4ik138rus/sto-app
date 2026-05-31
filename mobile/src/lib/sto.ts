import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateAttachmentMetadataInput,
  CreateDiagnosticInput,
  CreateRecommendationInput,
  ListAttachmentsQuery,
  PatchInspectionActInput,
  StaffRole,
  UpdateRecommendationInput,
  UpdateDiagnosticInput,
  UpsertInspectionActInput,
  WorkOrderStatus,
} from '@autoservice-app/contracts';

import { ApiRequestError } from './api';
import type { UploadAttachmentFileInput } from './api';
import { useAuth } from './auth';

export const stoQueryKeys = {
  me: ['sto', 'me'] as const,
  orders: (filters?: { search?: string; status?: WorkOrderStatus }) =>
    ['sto', 'orders', filters?.search ?? '', filters?.status ?? 'ALL'] as const,
  order: (id: string) => ['sto', 'orders', id] as const,
  inspection: (orderId: string) => ['sto', 'orders', orderId, 'inspection'] as const,
  diagnostics: (orderId: string) => ['sto', 'orders', orderId, 'diagnostics'] as const,
  diagnostic: (diagnosticId: string) => ['sto', 'diagnostics', diagnosticId] as const,
  recommendations: (orderId: string) => ['sto', 'orders', orderId, 'recommendations'] as const,
  attachments: (orderId: string, filters?: ListAttachmentsQuery) =>
    ['sto', 'orders', orderId, 'attachments', filters ? JSON.stringify(filters) : ''] as const,
  summary: (orderId: string) => ['sto', 'orders', orderId, 'summary'] as const,
  customers: (search?: string) => ['sto', 'customers', search ?? ''] as const,
  vehicles: (search?: string, customerId?: string | null) =>
    ['sto', 'vehicles', search ?? '', customerId ?? ''] as const,
};

export const workOrderStatuses = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'APPROVED',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
] as const satisfies readonly WorkOrderStatus[];

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  OPEN: 'Открыт',
  IN_PROGRESS: 'В работе',
  AWAITING_APPROVAL: 'На согласовании',
  APPROVED: 'Согласован',
  COMPLETED: 'Выполнен',
  CLOSED: 'Закрыт',
  CANCELLED: 'Отменен',
};

export const roleLabels: Record<StaffRole, string> = {
  MECHANIC: 'Механик',
  MASTER: 'Мастер',
  DIRECTOR: 'Директор',
  ADMIN: 'Администратор',
};

export function useStoMe() {
  const auth = useAuth();

  return useQuery({
    queryKey: stoQueryKeys.me,
    enabled: auth.isAuthenticated,
    queryFn: () => auth.api.getStoMe(),
  });
}

export function useInspection(orderId: string | undefined) {
  const auth = useAuth();

  return useQuery({
    queryKey: stoQueryKeys.inspection(orderId ?? ''),
    enabled: auth.isAuthenticated && Boolean(orderId),
    queryFn: () => auth.api.getInspection(orderId ?? ''),
  });
}

export function useUpsertInspection(orderId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertInspectionActInput) => auth.api.upsertInspection(orderId, input),
    onSuccess: async () => {
      await invalidateInspectionState(queryClient, orderId);
    },
  });
}

export function usePatchInspection(orderId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PatchInspectionActInput) => auth.api.patchInspection(orderId, input),
    onSuccess: async () => {
      await invalidateInspectionState(queryClient, orderId);
    },
  });
}

export function useDiagnostics(orderId: string | undefined) {
  const auth = useAuth();

  return useQuery({
    queryKey: stoQueryKeys.diagnostics(orderId ?? ''),
    enabled: auth.isAuthenticated && Boolean(orderId),
    queryFn: () => auth.api.listDiagnostics(orderId ?? ''),
  });
}

export function useDiagnostic(diagnosticId: string | undefined) {
  const auth = useAuth();

  return useQuery({
    queryKey: stoQueryKeys.diagnostic(diagnosticId ?? ''),
    enabled: auth.isAuthenticated && Boolean(diagnosticId),
    queryFn: () => auth.api.getDiagnostic(diagnosticId ?? ''),
  });
}

export function useCreateDiagnostic(orderId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDiagnosticInput) => auth.api.createDiagnostic(orderId, input),
    onSuccess: async (diagnostic) => {
      await invalidateDiagnosticState(queryClient, orderId, diagnostic.id);
    },
  });
}

export function useUpdateDiagnostic(diagnosticId: string | undefined, orderId?: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDiagnosticInput) => {
      if (!diagnosticId) throw new Error('Diagnostic id is required');
      return auth.api.updateDiagnostic(diagnosticId, input);
    },
    onSuccess: async (diagnostic) => {
      await invalidateDiagnosticState(queryClient, orderId ?? diagnostic.workOrderId, diagnostic.id);
    },
  });
}

export function useRecommendations(orderId: string | undefined) {
  const auth = useAuth();

  return useQuery({
    queryKey: stoQueryKeys.recommendations(orderId ?? ''),
    enabled: auth.isAuthenticated && Boolean(orderId),
    queryFn: () => auth.api.listRecommendations(orderId ?? ''),
  });
}

export function useCreateRecommendation(orderId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecommendationInput) => auth.api.createRecommendation(orderId, input),
    onSuccess: async (recommendation) => {
      await invalidateRecommendationState(queryClient, orderId, recommendation.id);
    },
  });
}

export function useUpdateRecommendation(orderId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recommendationId,
      input,
    }: {
      recommendationId: string;
      input: UpdateRecommendationInput;
    }) => auth.api.updateRecommendation(recommendationId, input),
    onSuccess: async (recommendation) => {
      await invalidateRecommendationState(queryClient, orderId, recommendation.id);
    },
  });
}

export function useAttachments(orderId: string | undefined, filters: ListAttachmentsQuery = {}) {
  const auth = useAuth();

  return useQuery({
    queryKey: stoQueryKeys.attachments(orderId ?? '', filters),
    enabled: auth.isAuthenticated && Boolean(orderId),
    queryFn: () => auth.api.listAttachments(orderId ?? '', filters),
  });
}

export function useCreateAttachmentMetadata(orderId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAttachmentMetadataInput) => auth.api.createAttachmentMetadata(orderId, input),
    onSuccess: async () => {
      await invalidateAttachmentState(queryClient, orderId);
    },
  });
}

export function useUploadAttachmentFile(orderId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadAttachmentFileInput) => auth.api.uploadAttachmentFile(orderId, input),
    onSuccess: async () => {
      await invalidateAttachmentState(queryClient, orderId);
    },
  });
}

export function useDeleteAttachment(orderId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => auth.api.deleteAttachment(attachmentId),
    onSuccess: async () => {
      await invalidateAttachmentState(queryClient, orderId);
    },
  });
}

export function useWorkOrderSummary(orderId: string | undefined) {
  const auth = useAuth();

  return useQuery({
    queryKey: stoQueryKeys.summary(orderId ?? ''),
    enabled: auth.isAuthenticated && Boolean(orderId),
    queryFn: () => auth.api.getWorkOrderSummary(orderId ?? ''),
  });
}

export function canCreateOrders(role: StaffRole | undefined) {
  return role === 'MASTER' || role === 'DIRECTOR' || role === 'ADMIN';
}

async function invalidateInspectionState(queryClient: ReturnType<typeof useQueryClient>, orderId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.inspection(orderId) }),
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.order(orderId) }),
    queryClient.invalidateQueries({ queryKey: ['sto', 'orders'] }),
  ]);
}

async function invalidateDiagnosticState(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
  diagnosticId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.diagnostics(orderId) }),
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.diagnostic(diagnosticId) }),
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.order(orderId) }),
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.summary(orderId) }),
    queryClient.invalidateQueries({ queryKey: ['sto', 'orders'] }),
  ]);
}

async function invalidateRecommendationState(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
  recommendationId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.recommendations(orderId) }),
    queryClient.invalidateQueries({ queryKey: ['sto', 'recommendations', recommendationId] }),
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.order(orderId) }),
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.summary(orderId) }),
    queryClient.invalidateQueries({ queryKey: ['sto', 'orders'] }),
  ]);
}

async function invalidateAttachmentState(queryClient: ReturnType<typeof useQueryClient>, orderId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.attachments(orderId) }),
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.order(orderId) }),
    queryClient.invalidateQueries({ queryKey: stoQueryKeys.summary(orderId) }),
    queryClient.invalidateQueries({ queryKey: ['sto', 'orders'] }),
  ]);
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === 'STO_STAFF_PROFILE_REQUIRED') {
      return 'У пользователя нет профиля сотрудника СТО. Запусти seed или обратись к администратору.';
    }
    if (error.status === 401) return 'Сессия истекла. Войдите снова.';
    if (error.status === 403) return 'Недостаточно прав для этого действия.';
    if (error.status === 409) return 'Конфликт данных. Проверь номер заказ-наряда.';
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось выполнить запрос. Проверь backend и сеть.';
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
