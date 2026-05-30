import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { InspectionProgress } from '@/lib/inspection-form';

type SaveBarProps = {
  progress: InspectionProgress;
  dirty: boolean;
  isLastSection: boolean;
  saving: boolean;
  onNext: () => void;
  onSave: () => void;
  onSaveExit: () => void;
};

export function SaveBar({
  progress,
  dirty,
  isLastSection,
  saving,
  onNext,
  onSave,
  onSaveExit,
}: SaveBarProps) {
  const colors = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.progressRow}>
        <Typography variant="bodySm" weight="700">
          Заполнено {progress.filled}/{progress.total}
        </Typography>
        <Typography muted variant="bodySm">
          {dirty ? 'Есть несохраненные изменения' : 'Сохранено'}
        </Typography>
      </View>
      <View style={[styles.track, { backgroundColor: colors.backgroundElement }]}>
        <View style={[styles.fill, { backgroundColor: colors.text, width: `${progress.percent}%` }]} />
      </View>
      <View style={styles.actions}>
        <Button disabled={isLastSection} variant="outline" onPress={onNext}>
          Следующий раздел
        </Button>
        <Button disabled={!dirty || saving} loading={saving} variant="outline" onPress={onSave}>
          Сохранить
        </Button>
        <Button disabled={saving} loading={saving} onPress={onSaveExit}>
          Сохранить и выйти
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  track: {
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  wrapper: {
    gap: Spacing.two,
  },
});
