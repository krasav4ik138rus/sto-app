import type { StoFormTemplate } from '@autoservice-app/contracts';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/button';

type FormSectionNavProps = {
  template: StoFormTemplate;
  currentSectionId: string;
  onChange: (sectionId: string) => void;
};

export function FormSectionNav({ template, currentSectionId, onChange }: FormSectionNavProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {template.sections.map((section) => (
        <Button
          key={section.id}
          size="sm"
          variant={section.id === currentSectionId ? 'default' : 'outline'}
          onPress={() => onChange(section.id)}>
          {section.label}
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
