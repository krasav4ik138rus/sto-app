import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { SummarySectionCard } from './SummarySectionCard';

export function SummaryActionsCard({
  onOpenAttachments,
  onOpenDiagnostics,
  onOpenInspection,
  onOpenOrder,
  onOpenRecommendations,
}: {
  onOpenAttachments: () => void;
  onOpenDiagnostics: () => void;
  onOpenInspection: () => void;
  onOpenOrder: () => void;
  onOpenRecommendations: () => void;
}) {
  const showLater = () => Alert.alert('Будет реализовано позже');

  return (
    <SummarySectionCard title="Действия">
      <View style={styles.actions}>
        <Button variant="outline" onPress={onOpenInspection}>Редактировать акт</Button>
        <Button variant="outline" onPress={onOpenDiagnostics}>Редактировать диагностику</Button>
        <Button variant="outline" onPress={onOpenRecommendations}>Рекомендации</Button>
        <Button variant="outline" onPress={onOpenAttachments}>Фото/файлы</Button>
        <Button variant="outline" onPress={onOpenOrder}>Карточка заказа</Button>
      </View>
      <View style={styles.actions}>
        <Button variant="outline" onPress={showLater}>Export PDF</Button>
        <Button variant="outline" onPress={showLater}>Print</Button>
        <Button variant="outline" onPress={showLater}>Share</Button>
      </View>
    </SummarySectionCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
