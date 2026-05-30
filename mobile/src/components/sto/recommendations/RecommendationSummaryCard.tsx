import { StyleSheet, View } from 'react-native';
import type { RecommendationStatus } from '@autoservice-app/contracts';

import { InfoRow } from '@/components/sto-ui';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatMoney,
  recommendationStatusLabels,
  type RecommendationSummary,
} from '@/lib/recommendations';

type RecommendationSummaryCardProps = {
  summary: RecommendationSummary;
};

export function RecommendationSummaryCard({ summary }: RecommendationSummaryCardProps) {
  const colors = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.backgroundElement }]}>
      <View style={styles.header}>
        <Typography variant="h4" weight="800">
          Итого по рекомендациям
        </Typography>
        <Typography muted variant="bodySm">
          {summary.counts.SUGGESTED + summary.counts.APPROVED + summary.counts.DECLINED + summary.counts.DONE} поз.
        </Typography>
      </View>

      <View style={styles.grid}>
        <InfoRow label="Запчасти" value={formatMoney(summary.partsTotal)} />
        <InfoRow label="Работы" value={formatMoney(summary.serviceTotal)} />
        <InfoRow label="Всего" value={formatMoney(summary.grandTotal)} />
      </View>

      <View style={styles.statusGrid}>
        {statusOrder.map((status) => (
          <InfoRow key={status} label={recommendationStatusLabels[status]} value={summary.counts[status]} />
        ))}
      </View>
    </View>
  );
}

const statusOrder = ['SUGGESTED', 'APPROVED', 'DECLINED', 'DONE'] as const satisfies readonly RecommendationStatus[];

const styles = StyleSheet.create({
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
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
