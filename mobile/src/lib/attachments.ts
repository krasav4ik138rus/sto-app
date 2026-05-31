import type {
  AttachmentContextSide,
  AttachmentContextType,
  AttachmentType,
  AttachmentVisibility,
  DiagnosticItem,
  OrderAttachmentDto,
  StaffRole,
} from '@autoservice-app/contracts';
import type { DiagnosticSideName } from './diagnostic-form';

export type LocalAttachmentDraft = {
  type: AttachmentType;
  uri: string;
  originalFilename: string;
  mimeType: string | null;
  byteSize: number | null;
};

export type AttachmentLinkTarget = {
  id: string;
  label: string;
  inspectionActId?: string | null;
  diagnosticId?: string | null;
  recommendationId?: string | null;
  contextType?: AttachmentContextType;
  contextSectionId?: string | null;
  contextFieldId?: string | null;
  contextSide?: AttachmentContextSide;
  contextLabel?: string | null;
};

export const attachmentTypeLabels: Record<AttachmentType, string> = {
  PHOTO: 'Фото',
  DOCUMENT: 'Документ',
  VIDEO: 'Видео',
};

export const attachmentVisibilityLabels: Record<AttachmentVisibility, string> = {
  INTERNAL: 'Внутреннее',
  CUSTOMER_VISIBLE: 'Видно клиенту',
};

export const attachmentContextTypeLabels: Record<AttachmentContextType, string> = {
  ORDER: 'Заказ',
  INSPECTION_ACT: 'Акт осмотра',
  INSPECTION_FIELD: 'Акт осмотра',
  DIAGNOSTIC: 'Диагностика',
  DIAGNOSTIC_ITEM: 'Диагностика',
  RECOMMENDATION: 'Рекомендация',
};

export const attachmentContextSideLabels: Record<AttachmentContextSide, string> = {
  NONE: '',
  LEFT: 'левая сторона',
  RIGHT: 'правая сторона',
};

export function canDeleteAttachment(
  attachment: OrderAttachmentDto,
  role: StaffRole | undefined,
  staffProfileId: string | undefined,
) {
  return (
    role === 'MASTER' ||
    role === 'DIRECTOR' ||
    role === 'ADMIN' ||
    attachment.createdByStaffProfileId === staffProfileId
  );
}

export function formatBytes(value: number | null | undefined) {
  if (!value) return '—';
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} КБ`;
  return `${(value / 1024 / 1024).toFixed(1)} МБ`;
}

export function generateDevStorageKey(orderId: string, filename: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `dev/orders/${orderId}/${timestamp}-${safeFilename(filename)}`;
}

export function attachmentLinkLabel(attachment: OrderAttachmentDto) {
  if (attachment.contextType === 'INSPECTION_FIELD') {
    return `Акт осмотра -> ${attachment.contextLabel ?? attachment.contextFieldId ?? 'поле'}`;
  }
  if (attachment.contextType === 'DIAGNOSTIC_ITEM') {
    return `Диагностика -> ${attachment.contextLabel ?? attachment.contextFieldId ?? 'пункт'}`;
  }
  if (attachment.contextType === 'DIAGNOSTIC') return 'Диагностика';
  if (attachment.contextType === 'INSPECTION_ACT') return 'Акт осмотра';
  if (attachment.contextType === 'RECOMMENDATION') return 'Рекомендация';
  if (attachment.inspectionActId) return 'Акт осмотра';
  if (attachment.diagnosticId) return 'Диагностика';
  if (attachment.recommendationId) return 'Рекомендация';
  return 'Заказ';
}

export function diagnosticAttachmentLabel(diagnostic: { createdAt: string }) {
  const date = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(diagnostic.createdAt));

  return `Диагностика от ${date}`;
}

export function recommendationAttachmentLabel(recommendation: { text: string }) {
  return `Рекомендация: ${shortText(recommendation.text)}`;
}

export function buildDiagnosticItemAttachmentContext(input: {
  diagnosticId: string;
  item: DiagnosticItem;
  side: DiagnosticSideName;
}) {
  const contextSide = diagnosticSideToAttachmentContextSide(input.side);
  const contextLabel = diagnosticItemContextLabel(input.item.label, contextSide);

  return {
    diagnosticId: input.diagnosticId,
    contextType: 'DIAGNOSTIC_ITEM' as const,
    contextSectionId: input.item.category,
    contextFieldId: input.item.id,
    contextSide,
    contextLabel,
    caption: contextLabel,
  };
}

export function getDiagnosticItemAttachments(
  attachments: OrderAttachmentDto[],
  diagnosticId: string | null | undefined,
  itemId: string,
  side: DiagnosticSideName,
) {
  const contextSide = diagnosticSideToAttachmentContextSide(side);
  return attachments.filter(
    (attachment) =>
      attachment.type === 'PHOTO' &&
      attachment.contextType === 'DIAGNOSTIC_ITEM' &&
      attachment.diagnosticId === diagnosticId &&
      attachment.contextFieldId === itemId &&
      attachment.contextSide === contextSide,
  );
}

export function diagnosticSideToAttachmentContextSide(side: DiagnosticSideName): AttachmentContextSide {
  if (side === 'left') return 'LEFT';
  if (side === 'right') return 'RIGHT';
  return 'NONE';
}

export function filenameFromUri(uri: string, fallback: string) {
  const cleanUri = uri.split('?')[0] ?? uri;
  const filename = cleanUri.split('/').filter(Boolean).at(-1);
  return filename ? safeFilename(decodeURIComponent(filename)) : fallback;
}

export function shortText(value: string, limit = 36) {
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1)}…`;
}

function safeFilename(filename: string) {
  const normalized = filename.trim().replace(/[/\\:*?"<>|#%{}^~[\]`]/g, '-');
  return normalized || 'attachment';
}

function diagnosticItemContextLabel(label: string, side: AttachmentContextSide) {
  if (side === 'LEFT') return `${label} - левая сторона`;
  if (side === 'RIGHT') return `${label} - правая сторона`;
  return label;
}
