import type { DiagnosticDto, RecommendationDto, RecommendationStatus, StaffRole } from '@autoservice-app/contracts';

export const recommendationStatusLabels: Record<RecommendationStatus, string> = {
  SUGGESTED: 'Предложено',
  APPROVED: 'Согласовано',
  DECLINED: 'Отклонено',
  DONE: 'Выполнено',
};

export const recommendationStatuses = ['SUGGESTED', 'APPROVED', 'DECLINED', 'DONE'] as const satisfies readonly RecommendationStatus[];

export type RecommendationSummary = {
  partsTotal: number;
  serviceTotal: number;
  grandTotal: number;
  counts: Record<RecommendationStatus, number>;
};

export type MoneyParseResult =
  | { ok: true; value: string | null; amount: number }
  | { ok: false; message: string };

export function canManageRecommendationStatus(role: StaffRole | undefined) {
  return role === 'MASTER' || role === 'DIRECTOR' || role === 'ADMIN';
}

export function canEditRecommendation(
  recommendation: RecommendationDto,
  role: StaffRole | undefined,
  staffProfileId: string | undefined,
) {
  if (canManageRecommendationStatus(role)) return true;
  return (
    role === 'MECHANIC' &&
    recommendation.status === 'SUGGESTED' &&
    recommendation.createdByStaffProfileId === staffProfileId
  );
}

export function nextRecommendationStatuses(
  status: RecommendationStatus,
  role: StaffRole | undefined,
): RecommendationStatus[] {
  if (!canManageRecommendationStatus(role)) return [];

  if (status === 'SUGGESTED') return ['APPROVED', 'DECLINED'];
  if (status === 'APPROVED') return ['DONE', 'DECLINED'];
  return [];
}

export function calculateRecommendationsSummary(items: RecommendationDto[]): RecommendationSummary {
  return items.reduce<RecommendationSummary>(
    (summary, item) => {
      const partsPrice = moneyToNumber(item.partsPrice);
      const servicePrice = moneyToNumber(item.servicePrice);
      const totalPrice = moneyToNumber(item.totalPrice) || partsPrice + servicePrice;

      summary.partsTotal += partsPrice;
      summary.serviceTotal += servicePrice;
      summary.grandTotal += totalPrice;
      summary.counts[item.status] += 1;

      return summary;
    },
    {
      partsTotal: 0,
      serviceTotal: 0,
      grandTotal: 0,
      counts: {
        SUGGESTED: 0,
        APPROVED: 0,
        DECLINED: 0,
        DONE: 0,
      },
    },
  );
}

export function parseMoneyInput(value: string | null | undefined, label: string): MoneyParseResult {
  const normalized = value?.trim().replace(',', '.') ?? '';
  if (!normalized) return { ok: true, value: null, amount: 0 };

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { ok: false, message: `${label}: укажите сумму без минуса, максимум 2 знака после точки.` };
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, message: `${label}: сумма должна быть не меньше 0.` };
  }

  return { ok: true, value: normalized, amount };
}

export function moneyToNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: string | number | null | undefined) {
  return new Intl.NumberFormat('ru-RU', {
    currency: 'RUB',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(moneyToNumber(value));
}

export function diagnosticLabel(diagnostic: DiagnosticDto | undefined) {
  if (!diagnostic) return 'Диагностика не выбрана';

  const date = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(diagnostic.createdAt));

  return `Диагностика от ${date}`;
}

export function shortId(id: string) {
  return id.slice(0, 8);
}
