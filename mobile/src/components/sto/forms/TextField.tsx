import { View, StyleSheet } from 'react-native';

import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';

type TextFieldProps = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

export function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Typography variant="label" weight="700">
        {label}
      </Typography>
      <Input value={value ?? ''} onChangeText={(next) => onChange(next.trim() ? next : null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
});
