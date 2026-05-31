import type { OrderAttachmentDto, StaffRole } from '@autoservice-app/contracts';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/sto-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  attachmentLinkLabel,
  attachmentTypeLabels,
  attachmentVisibilityLabels,
  canDeleteAttachment,
  formatBytes,
} from '@/lib/attachments';
import { formatDateTime } from '@/lib/sto';

type AttachmentCardProps = {
  attachment: OrderAttachmentDto;
  deleting?: boolean;
  fileHeaders?: Record<string, string>;
  fileUrl?: string;
  previewUri?: string;
  role: StaffRole | undefined;
  staffProfileId: string | undefined;
  onDelete: () => void;
  onOpen: () => void;
};

export function AttachmentCard({
  attachment,
  deleting,
  fileHeaders,
  fileUrl,
  previewUri,
  role,
  staffProfileId,
  onDelete,
  onOpen,
}: AttachmentCardProps) {
  const colors = useTheme();
  const canDelete = canDeleteAttachment(attachment, role, staffProfileId);
  const imageUri = attachment.type === 'PHOTO' ? previewUri ?? fileUrl ?? attachment.fileUrl ?? undefined : undefined;
  const title = attachment.caption || attachment.originalFilename || attachmentTypeLabels[attachment.type];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.backgroundElement,
          opacity: pressed ? 0.72 : 1,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.previewBox}>
          {imageUri ? (
            <Image contentFit="cover" source={{ headers: fileHeaders, uri: imageUri }} style={styles.previewImage} />
          ) : (
            <Typography align="center" variant="bodySm" weight="800">
              {attachmentTypeLabels[attachment.type]}
            </Typography>
          )}
        </View>
        <View style={styles.titleBlock}>
          <Typography variant="bodyLg" weight="800">
            {title}
          </Typography>
          <View style={styles.badges}>
            <Badge variant="outline">Тип: {attachmentTypeLabels[attachment.type]}</Badge>
            <Badge variant="outline">Доступ: {attachmentVisibilityLabels[attachment.visibility]}</Badge>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <InfoRow label="Файл" value={attachment.originalFilename ?? '—'} />
        <InfoRow label="MIME" value={attachment.mimeType ?? '—'} />
        <InfoRow label="Размер" value={formatBytes(attachment.byteSize)} />
        <InfoRow label="Связь" value={attachmentLinkLabel(attachment)} />
        <InfoRow label="Создан" value={formatDateTime(attachment.createdAt)} />
      </View>

      <View style={styles.actions}>
        <Button size="sm" variant="outline" onPress={onOpen}>
          Открыть
        </Button>
      {canDelete ? (
        <Button loading={deleting} size="sm" variant="destructive" onPress={onDelete}>
          Удалить
        </Button>
      ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  previewBox: {
    alignItems: 'center',
    borderRadius: 8,
    height: 84,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 84,
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.two,
  },
});
