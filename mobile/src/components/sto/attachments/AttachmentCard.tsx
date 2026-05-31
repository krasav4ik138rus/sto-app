import type { OrderAttachmentDto, StaffRole } from '@autoservice-app/contracts';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

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
  previewUri?: string;
  role: StaffRole | undefined;
  staffProfileId: string | undefined;
  onDelete: () => void;
};

export function AttachmentCard({
  attachment,
  deleting,
  previewUri,
  role,
  staffProfileId,
  onDelete,
}: AttachmentCardProps) {
  const colors = useTheme();
  const canDelete = canDeleteAttachment(attachment, role, staffProfileId);
  const imageUri = attachment.type === 'PHOTO' ? previewUri ?? attachment.fileUrl ?? undefined : undefined;

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.backgroundElement }]}>
      <View style={styles.header}>
        <View style={styles.previewBox}>
          {imageUri ? (
            <Image contentFit="cover" source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <Typography align="center" variant="bodySm" weight="800">
              {attachmentTypeLabels[attachment.type]}
            </Typography>
          )}
        </View>
        <View style={styles.titleBlock}>
          <Typography variant="bodyLg" weight="800">
            {attachment.caption || attachment.originalFilename || attachment.storageKey}
          </Typography>
          <View style={styles.badges}>
            <Badge variant="outline">{attachmentTypeLabels[attachment.type]}</Badge>
            <Badge variant="outline">{attachmentVisibilityLabels[attachment.visibility]}</Badge>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <InfoRow label="Файл" value={attachment.originalFilename ?? '—'} />
        <InfoRow label="MIME" value={attachment.mimeType ?? '—'} />
        <InfoRow label="Размер" value={formatBytes(attachment.byteSize)} />
        <InfoRow label="Связь" value={attachmentLinkLabel(attachment)} />
        <InfoRow label="Создан" value={formatDateTime(attachment.createdAt)} />
        <InfoRow label="Storage key" value={attachment.storageKey} />
      </View>

      {canDelete ? (
        <Button loading={deleting} size="sm" variant="destructive" onPress={onDelete}>
          Удалить
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badges: {
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
