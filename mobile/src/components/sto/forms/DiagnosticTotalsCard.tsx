import { StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/sto-ui';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DiagnosticTotals } from '@/lib/diagnostic-form';

type DiagnosticTotalsCardProps = {
  totals: DiagnosticTotals;
};

export function DiagnosticTotalsCard({ totals }: DiagnosticTotalsCardProps) {
  const colors = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.backgroundElement }]}>
      <Typography variant="h4" weight="800">
        Итоги
      </Typography>
      <View style={styles.grid}>
        <InfoRow label="Запчасти" value={`${totals.partsTotal} ₽`} />
        <InfoRow label="Работы" value={`${totals.serviceTotal} ₽`} />
        <InfoRow label="Всего" value={`${totals.grandTotal} ₽`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
