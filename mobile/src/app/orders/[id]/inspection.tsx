import { inspectionActTemplateV1 } from '@autoservice-app/contracts';
import type { InspectionActData } from '@autoservice-app/contracts';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { InspectionForm } from '@/components/sto/forms/InspectionForm';
import { SaveBar } from '@/components/sto/forms/SaveBar';
import { InfoRow, StateBlock } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  calculateInspectionProgress,
  isLastInspectionSection,
  mergeInspectionWithSnapshot,
  nextInspectionSectionId,
} from '@/lib/inspection-form';
import {
  formatDateTime,
  getApiErrorMessage,
  stoQueryKeys,
  useInspection,
  useUpsertInspection,
} from '@/lib/sto';

export default function InspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id ?? '';
  const auth = useAuth();
  const router = useRouter();
  const order = useQuery({
    queryKey: stoQueryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: () => auth.api.getWorkOrder(orderId),
  });
  const inspection = useInspection(orderId);
  const upsertInspection = useUpsertInspection(orderId);
  const [draft, setDraft] = useState<InspectionActData | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState('');
  const [currentSectionId, setCurrentSectionId] = useState(inspectionActTemplateV1.sections[0]?.id ?? 'general');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const sourceDraft = useMemo(() => {
    if (!order.data || !inspection.isSuccess) return null;
    return mergeInspectionWithSnapshot(
      inspectionActTemplateV1,
      inspection.data.inspectionAct?.dataJson,
      order.data,
    );
  }, [inspection.data?.inspectionAct?.dataJson, inspection.isSuccess, order.data]);

  const draftFingerprint = useMemo(() => (draft ? JSON.stringify(draft) : ''), [draft]);
  const hasUnsavedChanges = Boolean(draft) && draftFingerprint !== savedFingerprint;
  const progress = draft
    ? calculateInspectionProgress(inspectionActTemplateV1, draft)
    : { filled: 0, total: 0, percent: 0 };
  const isLastSection = isLastInspectionSection(inspectionActTemplateV1, currentSectionId);

  useEffect(() => {
    if (!sourceDraft) return;
    const nextFingerprint = JSON.stringify(sourceDraft);
    if (!draft || !hasUnsavedChanges) {
      setDraft(sourceDraft);
      setSavedFingerprint(nextFingerprint);
    }
  }, [draft, hasUnsavedChanges, sourceDraft]);

  const handleSave = async (options: { exit?: boolean } = {}) => {
    if (!draft) return;

    try {
      const response = await upsertInspection.mutateAsync({
        dataJson: draft,
        completedAt: null,
      });
      const savedDraft = response.inspectionAct?.dataJson ?? draft;
      setDraft(savedDraft);
      setSavedFingerprint(JSON.stringify(savedDraft));
      setSavedAt(new Date().toISOString());

      if (options.exit) {
        router.replace(orderHref(orderId));
        return;
      }

      Alert.alert('Акт сохранен', 'Данные акта осмотра отправлены на backend.');
    } catch (error) {
      Alert.alert('Акт не сохранен', getInspectionErrorMessage(error));
    }
  };

  const handleExit = () => {
    if (!hasUnsavedChanges) {
      router.replace(orderHref(orderId));
      return;
    }

    Alert.alert('Есть несохраненные изменения', 'Сохранить акт перед выходом?', [
      { text: 'Остаться', style: 'cancel' },
      { text: 'Выйти без сохранения', style: 'destructive', onPress: () => router.replace(orderHref(orderId)) },
      { text: 'Сохранить', onPress: () => void handleSave({ exit: true }) },
    ]);
  };

  if (order.isPending || inspection.isPending || !draft) {
    return <StateBlock title="Загружаем акт осмотра" />;
  }

  if (order.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Заказ-наряд не найден"
          description={getInspectionErrorMessage(order.error)}
          actionLabel="Повторить"
          onAction={() => void order.refetch()}
        />
      </Screen>
    );
  }

  if (inspection.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Акт не загрузился"
          description={getInspectionErrorMessage(inspection.error)}
          actionLabel="Повторить"
          onAction={() => void inspection.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      backButton={false}
      keyboardAvoiding
      scroll
      scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Typography variant="h2" weight="800">
            Акт осмотра
          </Typography>
          <Typography muted>
            {order.data.number} · {order.data.vehicle.brandModel}
          </Typography>
        </View>
        <Button variant="outline" onPress={handleExit}>
          Назад
        </Button>
      </View>

      <View style={styles.metaGrid}>
        <InfoRow label="Клиент" value={order.data.customer?.name ?? order.data.customer?.phone ?? '—'} />
        <InfoRow label="Госномер" value={order.data.vehicle.plate ?? '—'} />
        <InfoRow label="VIN" value={order.data.vehicle.vin ?? '—'} />
        <InfoRow label="Пробег" value={order.data.mileage ? `${order.data.mileage} км` : '—'} />
        <InfoRow
          label="Состояние акта"
          value={inspection.data.inspectionAct ? 'Акт заполнен' : 'Новый черновик'}
        />
        <InfoRow
          label="Последнее сохранение"
          value={savedAt ? formatDateTime(savedAt) : inspection.data.inspectionAct ? formatDateTime(inspection.data.inspectionAct.updatedAt) : '—'}
        />
      </View>

      <InspectionForm
        template={inspectionActTemplateV1}
        data={draft}
        currentSectionId={currentSectionId}
        onChange={setDraft}
        onSectionChange={setCurrentSectionId}
      />

      <SaveBar
        dirty={hasUnsavedChanges}
        isLastSection={isLastSection}
        progress={progress}
        saving={upsertInspection.isPending}
        onNext={() => setCurrentSectionId(nextInspectionSectionId(inspectionActTemplateV1, currentSectionId))}
        onSave={() => void handleSave()}
        onSaveExit={() => void handleSave({ exit: true })}
      />
    </Screen>
  );
}

function getInspectionErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) return 'Нет доступа к акту этого заказ-наряда.';
    if (error.status === 404) return 'Заказ-наряд не найден.';
    if (error.status === 400) return 'Проверьте заполнение формы акта осмотра.';
  }

  return getApiErrorMessage(error);
}

function orderHref(orderId: string) {
  return `/orders/${orderId}` as Href;
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.one,
  },
});
