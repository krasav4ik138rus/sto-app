import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

type NumberFieldProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
};

export function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <View style={styles.field}>
      <Typography variant="label" weight="700">
        {label}
      </Typography>
      <Input
        keyboardType="number-pad"
        value={value === null ? '' : String(value)}
        onChangeText={(next) => onChange(parseNumber(next))}
      />
    </View>
  );
}

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
});
