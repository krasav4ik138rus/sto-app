import type { OrderAttachmentDto, WorkOrderSummaryDto } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/sto-ui';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { DiagnosticProblemAttachments } from './DiagnosticProblemAttachments';
import { SummarySectionCard } from './SummarySectionCard';
import {
  diagnosticProblemAttachments,
  diagnosticProblemCategory,
  diagnosticProblemLabel,
  diagnosticSideLabels,
  diagnosticStatusLabels,
  formatMoneyRub,
} from './summary-utils';

type DiagnosticProblem = NonNullable<WorkOrderSummaryDto['diagnosticProblemItems']>[number];

export function DiagnosticProblemsCard({
  attachments,
  fileHeaders,
  getFileUrl,
  onOpenAttachment,
  onOpenAttachmentsScreen,
  problems,
}: {
  attachments: OrderAttachmentDto[];
  fileHeaders: Record<string, string>;
  getFileUrl: (attachmentId: string) => string;
  onOpenAttachment: (attachment: OrderAttachmentDto) => void;
  onOpenAttachmentsScreen: () => void;
  problems: DiagnosticProblem[];
}) {
  return (
    <SummarySectionCard title="Проблемы диагностики">
      {problems.length === 0 ? (
        <Typography muted>Проблем по диагностике не отмечено.</Typography>
      ) : (
        <View style={styles.list}>
          {problems.map((item) => {
            const itemAttachments = diagnosticProblemAttachments(attachments, item);
            return (
              <View key={`${item.diagnosticId}:${item.fieldKey}:${item.side}`} style={styles.problem}>
                <View style={styles.rowHeader}>
                  <View style={styles.titleBlock}>
                    <Typography weight="800">{diagnosticProblemLabel(item)}</Typography>
                    <Typography muted variant="bodySm">
                      {[diagnosticProblemCategory(item), diagnosticSideLabels[item.side]].filter(Boolean).join(' · ')}
                    </Typography>
                  </View>
                  <Badge variant={item.status === 'not_ok' ? 'destructive' : 'outline'}>
                    {diagnosticStatusLabels[item.status]}
                  </Badge>
                </View>
                <View style={styles.grid}>
                  <InfoRow label="Запчасти" value={formatMoneyRub(item.partsPrice)} />
                  <InfoRow label="Работы" value={formatMoneyRub(item.servicePrice)} />
                </View>
                {item.comment ? <Typography variant="bodySm">{item.comment}</Typography> : null}
                <DiagnosticProblemAttachments
                  attachmentCount={item.attachmentCount}
                  attachments={itemAttachments}
                  fileHeaders={fileHeaders}
                  getFileUrl={getFileUrl}
                  onOpenAttachment={onOpenAttachment}
                  onOpenAttachmentsScreen={onOpenAttachmentsScreen}
                />
              </View>
            );
          })}
        </View>
      )}
    </SummarySectionCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.three,
  },
  problem: {
    gap: Spacing.two,
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.half,
  },
});
