import type { StoFormField } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

type ChoiceFieldProps = {
  label: string;
  options: NonNullable<StoFormField['options']>;
  value: string | null;
  onChange: (value: string | null) => void;
};

export function ChoiceField({ label, options, value, onChange }: ChoiceFieldProps) {
  return (
    <View style={styles.field}>
      <Typography variant="label" weight="700">
        {label}
      </Typography>
      <View style={styles.options}>
        {options.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={value === option.value ? 'default' : 'outline'}
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
