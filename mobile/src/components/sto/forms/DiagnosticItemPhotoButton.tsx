import type { OrderAttachmentDto } from '@autoservice-app/contracts';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

type DiagnosticItemPhotoButtonProps = {
  attachments: OrderAttachmentDto[];
  fileHeaders: Record<string, string>;
  getFileUrl: (attachmentId: string) => string;
  showAddButton: boolean;
  uploading?: boolean;
  onAddPhoto: () => void;
};

export function DiagnosticItemPhotoButton({
  attachments,
  fileHeaders,
  getFileUrl,
  showAddButton,
  uploading,
  onAddPhoto,
}: DiagnosticItemPhotoButtonProps) {
  if (!showAddButton && attachments.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Typography variant="label" weight="700">
          Фото: {attachments.length}
        </Typography>
        {showAddButton ? (
          <Button loading={uploading} size="sm" variant="outline" onPress={onAddPhoto}>
            + Фото
          </Button>
        ) : null}
      </View>

      {attachments.length > 0 ? (
        <View style={styles.previewRow}>
          {attachments.slice(0, 4).map((attachment) => (
            <Image
              key={attachment.id}
              contentFit="cover"
              source={{ headers: fileHeaders, uri: getFileUrl(attachment.id) }}
              style={styles.preview}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  preview: {
    borderRadius: 8,
    height: 54,
    width: 54,
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  wrapper: {
    gap: Spacing.one,
  },
});
