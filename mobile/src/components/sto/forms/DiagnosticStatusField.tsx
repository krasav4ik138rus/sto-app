import type { DiagnosticStatus } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

const statusOptions = [
  { value: 'ok', label: 'Исправно' },
  { value: 'not_ok', label: 'Неисправно' },
  { value: 'recommend_service', label: 'Рекомендовано' },
] as const satisfies ReadonlyArray<{ value: DiagnosticStatus; label: string }>;

type DiagnosticStatusFieldProps = {
  label?: string;
  value: DiagnosticStatus | null;
  onChange: (value: DiagnosticStatus | null) => void;
};

export function DiagnosticStatusField({ label, value, onChange }: DiagnosticStatusFieldProps) {
  return (
    <View style={styles.field}>
      {label ? (
        <Typography variant="label" weight="700">
          {label}
        </Typography>
      ) : null}
      <View style={styles.options}>
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={value === option.value ? 'default' : 'outline'}
            style={styles.option}
            onPress={() => onChange(option.value)}>
            {option.label}
          </Button>
        ))}
        {value ? (
          <Button size="sm" variant="ghost" onPress={() => onChange(null)}>
            Очистить
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  option: {
    flexGrow: 1,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
