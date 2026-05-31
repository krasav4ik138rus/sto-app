import {
  diagnosticTemplateV1,
  inspectionActTemplateV1,
  type AttachmentContextSide,
  type OrderAttachmentDto,
  type WorkOrderSummaryDto,
} from '@autoservice-app/contracts';

export type InspectionProblemItem = NonNullable<WorkOrderSummaryDto['inspectionProblemItems']>[number];
export type DiagnosticProblemItem = NonNullable<WorkOrderSummaryDto['diagnosticProblemItems']>[number];

export const recommendationStatusLabels = {
  SUGGESTED: 'Предложено',
  APPROVED: 'Согласовано',
  DECLINED: 'Отклонено',
  DONE: 'Выполнено',
} as const;

export const inspectionConditionLabels = {
  ok: 'В норме',
  attention: 'Требует внимания',
  urgent: 'Срочно',
} as const;

export const diagnosticStatusLabels = {
  ok: 'В норме',
  not_ok: 'Неисправно',
  recommend_service: 'Рекомендовано',
} as const;

export const diagnosticSideLabels = {
  none: 'Без стороны',
  left: 'Левая сторона',
  right: 'Правая сторона',
} as const;

const inspectionFieldLabels = new Map(
  inspectionActTemplateV1.sections.flatMap((section) =>
    section.fields.map((field) => [field.id, { label: field.label, sectionLabel: section.label }] as const),
  ),
);

const diagnosticItemLabels = new Map(
  diagnosticTemplateV1.categories.flatMap((category) =>
    category.items.map((item) => [item.id, { label: item.label, categoryLabel: category.label }] as const),
  ),
);

export function inspectionProblemLabel(item: InspectionProblemItem) {
  return inspectionFieldLabels.get(item.fieldKey)?.label ?? item.fieldKey;
}

export function inspectionProblemSection(item: InspectionProblemItem) {
  return inspectionFieldLabels.get(item.fieldKey)?.sectionLabel ?? null;
}

export function diagnosticProblemLabel(item: DiagnosticProblemItem) {
  return diagnosticItemLabels.get(item.fieldKey)?.label ?? item.fieldKey;
}

export function diagnosticProblemCategory(item: DiagnosticProblemItem) {
  return diagnosticItemLabels.get(item.fieldKey)?.categoryLabel ?? null;
}

export function formatMoney(value: string | null | undefined) {
  if (!value) return '—';
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return value;
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numberValue);
}

export function formatMoneyRub(value: string | null | undefined) {
  const formatted = formatMoney(value);
  return formatted === '—' ? formatted : `${formatted} ₽`;
}

export function diagnosticProblemAttachments(
  attachments: OrderAttachmentDto[],
  item: DiagnosticProblemItem,
) {
  const contextSide = diagnosticSideToContextSide(item.side);
  return attachments.filter(
    (attachment) =>
      attachment.type === 'PHOTO' &&
      attachment.diagnosticId === item.diagnosticId &&
      attachment.contextType === 'DIAGNOSTIC_ITEM' &&
      attachment.contextFieldId === item.fieldKey &&
      attachment.contextSide === contextSide,
  );
}

export function diagnosticSideToContextSide(side: DiagnosticProblemItem['side']): AttachmentContextSide {
  if (side === 'left') return 'LEFT';
  if (side === 'right') return 'RIGHT';
  return 'NONE';
}
