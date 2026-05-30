import type { DiagnosticDto, RecommendationStatus } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { MoneyField } from '@/components/sto/forms/MoneyField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  diagnosticLabel,
  formatMoney,
  moneyToNumber,
  recommendationStatusLabels,
  recommendationStatuses,
} from '@/lib/recommendations';

export type RecommendationFormState = {
  id?: string;
  text: string;
  partsPrice: string;
  servicePrice: string;
  diagnosticId: string | null;
  inspectionActId: string | null;
  status: RecommendationStatus;
};

type RecommendationFormProps = {
  diagnostics: DiagnosticDto[];
  inspectionActId: string | null;
  mode: 'create' | 'edit';
  showStatusSelect: boolean;
  state: RecommendationFormState;
  saving?: boolean;
  onCancel: () => void;
  onChange: (state: RecommendationFormState) => void;
  onSubmit: () => void;
};

export function RecommendationForm({
  diagnostics,
  inspectionActId,
  mode,
  showStatusSelect,
  state,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: RecommendationFormProps) {
  const colors = useTheme();
  const totalPreview = moneyToNumber(state.partsPrice) + moneyToNumber(state.servicePrice);

  const update = (patch: Partial<RecommendationFormState>) => onChange({ ...state, ...patch });

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.backgroundElement }]}>
      <View style={styles.header}>
        <Typography variant="h4" weight="800">
          {mode === 'create' ? 'Новая рекомендация' : 'Редактирование'}
        </Typography>
        <Button size="sm" variant="ghost" onPress={onCancel}>
          Отмена
        </Button>
      </View>

      <View style={styles.field}>
        <Typography variant="label" weight="700">
          Текст рекомендации
        </Typography>
        <Input
          multiline
          invalid={state.text.trim().length === 0}
          placeholder="Что нужно сделать по автомобилю"
          style={styles.textArea}
          textAlignVertical="top"
          value={state.text}
          onChangeText={(text) => update({ text })}
        />
      </View>

      <View style={styles.moneyRow}>
        <MoneyField label="Запчасти" value={state.partsPrice} onChange={(partsPrice) => update({ partsPrice: partsPrice ?? '' })} />
        <MoneyField label="Работы" value={state.servicePrice} onChange={(servicePrice) => update({ servicePrice: servicePrice ?? '' })} />
      </View>

      <View style={styles.totalPreview}>
        <Typography muted variant="bodySm">
          Предварительный итог
        </Typography>
        <Typography variant="h4" weight="800">
          {formatMoney(totalPreview)}
        </Typography>
      </View>

      <View style={styles.field}>
        <Typography variant="label" weight="700">
          Связь с диагностикой
        </Typography>
        <View style={styles.chips}>
          <Button
            size="sm"
            variant={state.diagnosticId ? 'outline' : 'default'}
            onPress={() => update({ diagnosticId: null })}>
            Без диагностики
          </Button>
          {diagnostics.map((diagnostic) => (
            <Button
              key={diagnostic.id}
              size="sm"
              variant={state.diagnosticId === diagnostic.id ? 'default' : 'outline'}
              onPress={() => update({ diagnosticId: diagnostic.id })}>
              {diagnosticLabel(diagnostic)}
            </Button>
          ))}
        </View>
      </View>

      {inspectionActId ? (
        <View style={styles.field}>
          <Typography variant="label" weight="700">
            Акт осмотра
          </Typography>
          <View style={styles.chips}>
            <Button
              size="sm"
              variant={state.inspectionActId ? 'outline' : 'default'}
              onPress={() => update({ inspectionActId: null })}>
              Не связывать
            </Button>
            <Button
              size="sm"
              variant={state.inspectionActId === inspectionActId ? 'default' : 'outline'}
              onPress={() => update({ inspectionActId })}>
              Связать с актом
            </Button>
          </View>
        </View>
      ) : null}

      {showStatusSelect ? (
        <View style={styles.field}>
          <Typography variant="label" weight="700">
            Статус
          </Typography>
          <View style={styles.chips}>
            {recommendationStatuses.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={state.status === status ? 'default' : 'outline'}
                onPress={() => update({ status })}>
                {recommendationStatusLabels[status]}
              </Button>
            ))}
          </View>
        </View>
      ) : null}

      <Button disabled={state.text.trim().length === 0} loading={saving} onPress={onSubmit}>
        {mode === 'create' ? 'Создать рекомендацию' : 'Сохранить'}
      </Button>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.two,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  moneyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  textArea: {
    borderRadius: 16,
    minHeight: 104,
    paddingTop: 12,
  },
  totalPreview: {
    gap: Spacing.half,
  },
});
