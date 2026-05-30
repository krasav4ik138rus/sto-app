import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

type MoneyFieldProps = {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string | null) => void;
};

export function MoneyField({ label, value, onChange }: MoneyFieldProps) {
  return (
    <View style={styles.field}>
      <Typography variant="label" weight="700">
        {label}
      </Typography>
      <Input
        keyboardType="decimal-pad"
        value={value === null || value === undefined ? '' : String(value)}
        onChangeText={(next) => onChange(normalizeMoney(next))}
      />
    </View>
  );
}

function normalizeMoney(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  if (normalized.endsWith('.')) return normalized.slice(0, -1);
  return normalized;
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    gap: Spacing.two,
    minWidth: 130,
  },
});
