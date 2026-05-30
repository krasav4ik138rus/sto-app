import { useQuery } from '@tanstack/react-query';
import type { StaffRole, WorkOrderStatus } from '@autoservice-app/contracts';

import { ApiRequestError } from './api';
import { useAuth } from './auth';

export const stoQueryKeys = {
  me: ['sto', 'me'] as const,
  orders: (filters?: { search?: string; status?: WorkOrderStatus }) =>
    ['sto', 'orders', filters?.search ?? '', filters?.status ?? 'ALL'] as const,
  order: (id: string) => ['sto', 'orders', id] as const,
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

export function canCreateOrders(role: StaffRole | undefined) {
  return role === 'MASTER' || role === 'DIRECTOR' || role === 'ADMIN';
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
