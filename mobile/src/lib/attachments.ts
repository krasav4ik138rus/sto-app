import type {
  AttachmentType,
  AttachmentVisibility,
  OrderAttachmentDto,
  StaffRole,
} from '@autoservice-app/contracts';

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
