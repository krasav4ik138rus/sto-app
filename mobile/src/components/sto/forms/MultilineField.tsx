import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

type MultilineFieldProps = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

export function MultilineField({ label, value, onChange }: MultilineFieldProps) {
  return (
    <View style={styles.field}>
      <Typography variant="label" weight="700">
        {label}
      </Typography>
      <Input
        multiline
        textAlignVertical="top"
        value={value ?? ''}
        onChangeText={(next) => onChange(next.trim() ? next : null)}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 96,
    paddingTop: 12,
  },
});
