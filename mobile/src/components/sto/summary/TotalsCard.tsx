import type { WorkOrderSummaryDto } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/sto-ui';
import { Spacing } from '@/constants/theme';
import { SummarySectionCard } from './SummarySectionCard';
import { formatMoneyRub } from './summary-utils';

export function TotalsCard({ summary }: { summary: WorkOrderSummaryDto }) {
  return (
    <SummarySectionCard title="Итоги">
      <View style={styles.grid}>
        <InfoRow label="Запчасти" value={formatMoneyRub(summary.partsTotal)} />
        <InfoRow label="Работы" value={formatMoneyRub(summary.serviceTotal)} />
        <InfoRow label="Итого" value={formatMoneyRub(summary.grandTotal)} />
      </View>
    </SummarySectionCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
