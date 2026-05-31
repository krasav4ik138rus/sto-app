import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SummarySectionCard({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  const colors = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.backgroundElement }]}>
      <View style={styles.header}>
        <Typography variant="h4" weight="800">
          {title}
        </Typography>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
});
