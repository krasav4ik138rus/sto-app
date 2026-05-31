import type { DiagnosticData, OrderAttachmentDto } from '@autoservice-app/contracts';
import type { DiagnosticTemplate } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  calculateDiagnosticTotals,
  setDiagnosticTotalText,
  withDiagnosticTotals,
} from '@/lib/diagnostic-form';
import { DiagnosticCategoryNav } from './DiagnosticCategoryNav';
import { DiagnosticItemField } from './DiagnosticItemField';
import { DiagnosticTotalsCard } from './DiagnosticTotalsCard';
import { MultilineField } from './MultilineField';
import { TextField } from './TextField';

type DiagnosticFormProps = {
  attachments?: OrderAttachmentDto[];
  template: DiagnosticTemplate;
  data: DiagnosticData;
  diagnosticId?: string | null;
  currentCategoryId: string;
  fileHeaders?: Record<string, string>;
  getAttachmentFileUrl?: (attachmentId: string) => string;
  onChange: (data: DiagnosticData) => void;
  onCategoryChange: (categoryId: string) => void;
  onAddPhoto?: (input: {
    categoryId: string;
    item: DiagnosticTemplate['categories'][number]['items'][number];
    side: 'none' | 'left' | 'right';
  }) => void;
};

export function DiagnosticForm({
  attachments = [],
  template,
  data,
  diagnosticId,
  currentCategoryId,
  fileHeaders = {},
  getAttachmentFileUrl,
  onChange,
  onCategoryChange,
  onAddPhoto,
}: DiagnosticFormProps) {
  const colors = useTheme();
  const category = template.categories.find((candidate) => candidate.id === currentCategoryId) ?? template.categories[0];
  const totals = calculateDiagnosticTotals(data, template);

  return (
    <View style={styles.wrapper}>
      <DiagnosticCategoryNav template={template} currentCategoryId={category.id} onChange={onCategoryChange} />
      <DiagnosticTotalsCard totals={totals} />
      <View style={styles.sectionHeader}>
        <Typography variant="h4" weight="800">
          {category.label}
        </Typography>
      </View>

      {category.id === 'totals' ? (
        <View style={styles.fields}>
          <View style={[styles.fieldCard, { borderColor: colors.backgroundElement }]}>
            <MultilineField
              label="Прочие рекомендации"
              value={data.totals?.otherRecommendations ?? null}
              onChange={(value) => onChange(setDiagnosticTotalText(data, 'otherRecommendations', value))}
            />
          </View>
          <View style={[styles.fieldCard, { borderColor: colors.backgroundElement }]}>
            <MultilineField
              label="Комментарий по сход-развалу"
              value={data.totals?.alignmentComment ?? null}
              onChange={(value) => onChange(setDiagnosticTotalText(data, 'alignmentComment', value))}
            />
          </View>
          <View style={[styles.fieldCard, { borderColor: colors.backgroundElement }]}>
            <TextField
              label="Исполнитель"
              value={data.totals?.executorName ?? null}
              onChange={(value) => onChange(setDiagnosticTotalText(data, 'executorName', value))}
            />
          </View>
          <DiagnosticTotalsCard totals={totals} />
        </View>
      ) : (
        <View style={styles.fields}>
          {category.items.map((item) => (
            <View key={item.id} style={[styles.fieldCard, { borderColor: colors.backgroundElement }]}>
              <DiagnosticItemField
                attachments={attachments}
                data={data}
                diagnosticId={diagnosticId}
                fileHeaders={fileHeaders}
                getAttachmentFileUrl={getAttachmentFileUrl}
                item={item}
                onAddPhoto={(side) => onAddPhoto?.({ categoryId: category.id, item, side })}
                onChange={(nextData) => onChange(withDiagnosticTotals(nextData, template))}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
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
