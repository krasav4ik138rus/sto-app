import type {
  DiagnosticData,
  DiagnosticStatus,
  MoneyInput,
  WorkOrderDetailDto,
} from '@autoservice-app/contracts';
import type { DiagnosticItem, DiagnosticTemplate } from '@autoservice-app/contracts';

export type DiagnosticSideName = 'none' | 'left' | 'right';

export type DiagnosticSideValue = {
  status: DiagnosticStatus | null;
  partsPrice?: MoneyInput | null;
  servicePrice?: MoneyInput | null;
  comment?: string | null;
};

export type DiagnosticTotals = {
  partsTotal: string;
  serviceTotal: string;
  grandTotal: string;
};

export type DiagnosticProgress = {
  filled: number;
  total: number;
  percent: number;
};

export function createEmptyDiagnosticData(
  template: DiagnosticTemplate,
  orderDetail?: WorkOrderDetailDto | null,
): DiagnosticData {
  return {
    schemaVersion: template.version,
    values: {},
    totals: {
      otherRecommendations: null,
      alignmentComment: null,
      partsTotal: '0.00',
      serviceTotal: '0.00',
      grandTotal: '0.00',
      executorName: orderDetail?.responsibleStaffProfile?.fullName ?? null,
    },
  };
}

export function getDiagnosticItemValue(data: DiagnosticData, item: DiagnosticItem) {
  return data.values[item.id] ?? emptyItemValue(item);
}

export function setDiagnosticItemValue(
  data: DiagnosticData,
  itemId: string,
  value: DiagnosticData['values'][string],
): DiagnosticData {
  return {
    ...data,
    values: {
      ...data.values,
      [itemId]: value,
    },
  };
}

export function getDiagnosticSideValue(
  data: DiagnosticData,
  item: DiagnosticItem,
  side: DiagnosticSideName,
): DiagnosticSideValue {
  const value = getDiagnosticItemValue(data, item);
  if (side === 'none' || item.side === 'none') {
    return normalizeSideValue(value);
  }

  if (isBothValue(value)) {
    return normalizeSideValue(side === 'left' ? value.left : value.right);
  }

  return emptySideValue();
}

export function setDiagnosticSideStatus(
  data: DiagnosticData,
  itemId: string,
  side: DiagnosticSideName,
  status: DiagnosticStatus | null,
): DiagnosticData {
  return updateDiagnosticSide(data, itemId, side, (current) => {
    const next = {
      ...current,
      status,
    };
    return status === 'ok' || status === null ? clearPrices(next) : next;
  });
}

export function setDiagnosticSidePrices(
  data: DiagnosticData,
  itemId: string,
  side: DiagnosticSideName,
  partsPrice: MoneyInput | null,
  servicePrice: MoneyInput | null,
): DiagnosticData {
  return updateDiagnosticSide(data, itemId, side, (current) => ({
    ...current,
    partsPrice,
    servicePrice,
  }));
}

export function setDiagnosticSideComment(
  data: DiagnosticData,
  itemId: string,
  side: DiagnosticSideName,
  comment: string | null,
): DiagnosticData {
  return updateDiagnosticSide(data, itemId, side, (current) => ({
    ...current,
    comment,
  }));
}

export function clearDiagnosticSidePrices(
  data: DiagnosticData,
  itemId: string,
  side: DiagnosticSideName,
): DiagnosticData {
  return updateDiagnosticSide(data, itemId, side, clearPrices);
}

export function setDiagnosticTotalText(
  data: DiagnosticData,
  key: 'otherRecommendations' | 'alignmentComment' | 'executorName',
  value: string | null,
): DiagnosticData {
  return {
    ...data,
    totals: {
      ...data.totals,
      [key]: value,
    },
  };
}

export function calculateDiagnosticTotals(
  data: DiagnosticData,
  template: DiagnosticTemplate,
): DiagnosticTotals {
  let partsTotal = 0;
  let serviceTotal = 0;

  for (const item of template.categories.flatMap((category) => category.items)) {
    if (!item.hasPrice) continue;
    for (const side of sidesForItem(item)) {
      const value = getDiagnosticSideValue(data, item, side);
      if (value.status !== 'not_ok' && value.status !== 'recommend_service') continue;
      partsTotal += moneyToNumber(value.partsPrice);
      serviceTotal += moneyToNumber(value.servicePrice);
    }
  }

  return {
    partsTotal: formatMoney(partsTotal),
    serviceTotal: formatMoney(serviceTotal),
    grandTotal: formatMoney(partsTotal + serviceTotal),
  };
}

export function withDiagnosticTotals(data: DiagnosticData, template: DiagnosticTemplate): DiagnosticData {
  const totals = calculateDiagnosticTotals(data, template);
  return {
    ...data,
    totals: {
      ...data.totals,
      ...totals,
    },
  };
}

export function calculateDiagnosticProgress(
  template: DiagnosticTemplate,
  data: DiagnosticData,
): DiagnosticProgress {
  const inspectableItems = template.categories
    .filter((category) => category.id !== 'totals')
    .flatMap((category) => category.items);
  const total = inspectableItems.reduce((sum, item) => sum + sidesForItem(item).length, 0);
  const filled = inspectableItems.reduce((sum, item) => {
    return sum + sidesForItem(item).filter((side) => getDiagnosticSideValue(data, item, side).status !== null).length;
  }, 0);

  return {
    filled,
    total,
    percent: total > 0 ? Math.round((filled / total) * 100) : 0,
  };
}

export function nextDiagnosticCategoryId(template: DiagnosticTemplate, currentCategoryId: string) {
  const currentIndex = template.categories.findIndex((category) => category.id === currentCategoryId);
  return template.categories[Math.min(currentIndex + 1, template.categories.length - 1)]?.id ?? currentCategoryId;
}

export function isLastDiagnosticCategory(template: DiagnosticTemplate, currentCategoryId: string) {
  return template.categories.at(-1)?.id === currentCategoryId;
}

export function sidesForItem(item: DiagnosticItem): DiagnosticSideName[] {
  return item.side === 'both' ? ['left', 'right'] : ['none'];
}

export function moneyToNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function formatMoney(value: number) {
  return value.toFixed(2);
}

function updateDiagnosticSide(
  data: DiagnosticData,
  itemId: string,
  side: DiagnosticSideName,
  updater: (current: DiagnosticSideValue) => DiagnosticSideValue,
): DiagnosticData {
  const current = data.values[itemId];
  if (side === 'left' || side === 'right') {
    const pair = isBothValue(current) ? current : { left: emptySideValue(), right: emptySideValue() };
    return setDiagnosticItemValue(data, itemId, {
      left: side === 'left' ? updater(normalizeSideValue(pair.left)) : normalizeSideValue(pair.left),
      right: side === 'right' ? updater(normalizeSideValue(pair.right)) : normalizeSideValue(pair.right),
    });
  }

  return setDiagnosticItemValue(data, itemId, updater(normalizeSideValue(current)));
}

function emptyItemValue(item: DiagnosticItem): DiagnosticData['values'][string] {
  if (item.side === 'both') {
    return {
      left: emptySideValue(),
      right: emptySideValue(),
    };
  }

  return emptySideValue();
}

function emptySideValue(): DiagnosticSideValue {
  return {
    status: null,
    partsPrice: null,
    servicePrice: null,
    comment: null,
  };
}

function normalizeSideValue(value: unknown): DiagnosticSideValue {
  if (!value || typeof value !== 'object' || 'left' in value || 'right' in value) {
    return emptySideValue();
  }

  const record = value as DiagnosticSideValue;
  return {
    status: record.status ?? null,
    partsPrice: record.partsPrice ?? null,
    servicePrice: record.servicePrice ?? null,
    comment: record.comment ?? null,
  };
}

function isBothValue(value: unknown): value is { left: DiagnosticSideValue; right: DiagnosticSideValue } {
  return Boolean(value && typeof value === 'object' && 'left' in value && 'right' in value);
}

function clearPrices(value: DiagnosticSideValue): DiagnosticSideValue {
  return {
    ...value,
    partsPrice: null,
    servicePrice: null,
  };
}
