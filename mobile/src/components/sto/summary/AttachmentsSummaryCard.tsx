import type { OrderAttachmentDto } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { attachmentLinkLabel, attachmentTypeLabels, formatBytes } from '@/lib/attachments';
import { SummarySectionCard } from './SummarySectionCard';

export function AttachmentsSummaryCard({
  attachments,
  count,
  onOpenAttachments,
}: {
  attachments: OrderAttachmentDto[];
  count: number;
  onOpenAttachments: () => void;
}) {
  return (
    <SummarySectionCard
      title="Фото и файлы"
      action={
        <Button size="sm" variant="outline" onPress={onOpenAttachments}>
          Открыть
        </Button>
      }>
      <InfoRow label="Всего вложений" value={count} />
      {attachments.length === 0 ? (
        <Typography muted>Список файлов доступен на экране фото/файлов.</Typography>
      ) : (
        <View style={styles.list}>
          {attachments.slice(0, 5).map((attachment) => (
            <View key={attachment.id} style={styles.row}>
              <Typography weight="800">
                {attachment.caption || attachment.originalFilename || attachmentTypeLabels[attachment.type]}
              </Typography>
              <Typography muted variant="bodySm">
                {attachmentTypeLabels[attachment.type]} · {formatBytes(attachment.byteSize)} · {attachmentLinkLabel(attachment)}
              </Typography>
            </View>
          ))}
        </View>
      )}
    </SummarySectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    gap: Spacing.half,
  },
});
