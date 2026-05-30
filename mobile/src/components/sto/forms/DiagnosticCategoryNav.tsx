import type { DiagnosticTemplate } from '@autoservice-app/contracts';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

type DiagnosticCategoryNavProps = {
  template: DiagnosticTemplate;
  currentCategoryId: string;
  onChange: (categoryId: string) => void;
};

export function DiagnosticCategoryNav({
  template,
  currentCategoryId,
  onChange,
}: DiagnosticCategoryNavProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {template.categories.map((category) => (
        <Button
          key={category.id}
          size="sm"
          variant={category.id === currentCategoryId ? 'default' : 'outline'}
          onPress={() => onChange(category.id)}>
          {category.label}
        </Button>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
