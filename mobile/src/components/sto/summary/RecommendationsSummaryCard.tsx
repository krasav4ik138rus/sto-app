import type { WorkOrderSummaryDto } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/sto-ui';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { SummarySectionCard } from './SummarySectionCard';
import { formatMoneyRub, recommendationStatusLabels } from './summary-utils';

export function RecommendationsSummaryCard({
  recommendations,
}: {
  recommendations: NonNullable<WorkOrderSummaryDto['recommendations']>;
}) {
  return (
    <SummarySectionCard title="Рекомендации">
      {recommendations.length === 0 ? (
        <Typography muted>Рекомендаций пока нет.</Typography>
      ) : (
        <View style={styles.list}>
          {recommendations.map((item) => (
            <View key={item.id} style={styles.recommendation}>
              <View style={styles.rowHeader}>
                <Typography style={styles.title} weight="800">
                  {item.text}
                </Typography>
                <Badge variant={item.status === 'APPROVED' || item.status === 'DONE' ? 'default' : 'outline'}>
                  {recommendationStatusLabels[item.status]}
                </Badge>
              </View>
              <View style={styles.grid}>
                <InfoRow label="Запчасти" value={formatMoneyRub(item.partsPrice)} />
                <InfoRow label="Работы" value={formatMoneyRub(item.servicePrice)} />
                <InfoRow label="Итого" value={formatMoneyRub(item.totalPrice)} />
                <InfoRow
                  label="Связь"
                  value={item.diagnosticId ? 'Диагностика' : item.inspectionActId ? 'Акт осмотра' : 'Заказ'}
                />
              </View>
            </View>
          ))}
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
  recommendation: {
    gap: Spacing.two,
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
});
