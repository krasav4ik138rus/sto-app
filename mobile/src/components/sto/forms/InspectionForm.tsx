import type { InspectionActData, InspectionCondition } from '@autoservice-app/contracts';
import type { StoFormField, StoFormTemplate } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getInspectionFieldValue,
  setInspectionFieldValue,
  type InspectionFieldValue,
} from '@/lib/inspection-form';
import { ChoiceField } from './ChoiceField';
import { Condition3Field } from './Condition3Field';
import { FormSectionNav } from './FormSectionNav';
import { MultilineField } from './MultilineField';
import { NumberField } from './NumberField';
import { TextField } from './TextField';

type InspectionFormProps = {
  template: StoFormTemplate;
  data: InspectionActData;
  currentSectionId: string;
  onChange: (data: InspectionActData) => void;
  onSectionChange: (sectionId: string) => void;
};

export function InspectionForm({
  template,
  data,
  currentSectionId,
  onChange,
  onSectionChange,
}: InspectionFormProps) {
  const colors = useTheme();
  const section = template.sections.find((candidate) => candidate.id === currentSectionId) ?? template.sections[0];

  return (
    <View style={styles.wrapper}>
      <FormSectionNav template={template} currentSectionId={section.id} onChange={onSectionChange} />
      <View style={styles.sectionHeader}>
        <Typography variant="h4" weight="800">
          {section.label}
        </Typography>
      </View>
      <View style={styles.fields}>
        {section.fields.map((field) => (
          <View key={field.id} style={[styles.fieldCard, { borderColor: colors.backgroundElement }]}>
            <InspectionField
              field={field}
              sectionId={section.id}
              value={getInspectionFieldValue(data, section.id, field.id)}
              onChange={(value) => onChange(setInspectionFieldValue(data, section.id, field.id, value))}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function InspectionField({
  field,
  sectionId,
  value,
  onChange,
}: {
  field: StoFormField;
  sectionId: string;
  value: InspectionFieldValue;
  onChange: (value: InspectionFieldValue) => void;
}) {
  switch (field.type) {
    case 'text':
      return <TextField label={field.label} value={toStringValue(value)} onChange={onChange} />;
    case 'text_multiline':
      return <MultilineField label={field.label} value={toStringValue(value)} onChange={onChange} />;
    case 'number':
      return <NumberField label={field.label} value={toNumberValue(value)} onChange={onChange} />;
    case 'choice':
      return <ChoiceField label={field.label} options={field.options ?? []} value={toStringValue(value)} onChange={onChange} />;
    case 'condition3':
      return (
        <Condition3Field
          label={field.label}
          value={toConditionValue(value)}
          onChange={(next) => onChange(next)}
        />
      );
    case 'money':
      return <TextField label={field.label} value={toStringValue(value)} onChange={onChange} />;
    default:
      return (
        <TextField
          label={`${field.label} (${sectionId})`}
          value={toStringValue(value)}
          onChange={onChange}
        />
      );
  }
}

function toStringValue(value: InspectionFieldValue): string | null {
  return typeof value === 'string' ? value : value === null ? null : String(value);
}

function toNumberValue(value: InspectionFieldValue): number | null {
  return typeof value === 'number' ? value : null;
}

function toConditionValue(value: InspectionFieldValue): InspectionCondition | null {
  if (value === 'ok' || value === 'attention' || value === 'urgent') return value;
  return null;
}

const styles = StyleSheet.create({
  fieldCard: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  fields: {
    gap: Spacing.two,
  },
  sectionHeader: {
    gap: Spacing.one,
  },
  wrapper: {
    gap: Spacing.three,
  },
});
