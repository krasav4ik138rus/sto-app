import type { InspectionCondition } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

const conditionOptions = [
  { value: 'ok', label: 'В порядке' },
  { value: 'attention', label: 'Внимание' },
  { value: 'urgent', label: 'Срочно' },
] as const satisfies ReadonlyArray<{ value: InspectionCondition; label: string }>;

type Condition3FieldProps = {
  label: string;
  value: InspectionCondition | null;
  onChange: (value: InspectionCondition) => void;
};

export function Condition3Field({ label, value, onChange }: Condition3FieldProps) {
  return (
    <View style={styles.field}>
      <Typography variant="label" weight="700">
        {label}
      </Typography>
      <View style={styles.options}>
        {conditionOptions.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={value === option.value ? 'default' : 'outline'}
            style={styles.option}
            onPress={() => onChange(option.value)}>
            {option.label}
          </Button>
        ))}
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
