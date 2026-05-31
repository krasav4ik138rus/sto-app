import type { OrderAttachmentDto } from '@autoservice-app/contracts';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

export function DiagnosticProblemAttachments({
  attachmentCount,
  attachments,
  fileHeaders,
  getFileUrl,
  onOpenAttachment,
  onOpenAttachmentsScreen,
}: {
  attachmentCount?: number;
  attachments: OrderAttachmentDto[];
  fileHeaders: Record<string, string>;
  getFileUrl: (attachmentId: string) => string;
  onOpenAttachment: (attachment: OrderAttachmentDto) => void;
  onOpenAttachmentsScreen: () => void;
}) {
  const count = attachments.length || attachmentCount || 0;
  if (count === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Typography variant="label" weight="700">
        Фото: {count}
      </Typography>
      {attachments.length > 0 ? (
        <View style={styles.previewRow}>
          {attachments.slice(0, 4).map((attachment) => (
            <Pressable key={attachment.id} onPress={() => onOpenAttachment(attachment)}>
              <Image
                contentFit="cover"
                source={{ headers: fileHeaders, uri: getFileUrl(attachment.id) }}
                style={styles.preview}
              />
            </Pressable>
          ))}
        </View>
      ) : (
        <Button size="sm" variant="outline" onPress={onOpenAttachmentsScreen}>
          Открыть фото/файлы
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
