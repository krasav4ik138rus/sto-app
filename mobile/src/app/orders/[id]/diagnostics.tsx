import { diagnosticTemplateV1 } from '@autoservice-app/contracts';
import type { DiagnosticData, DiagnosticDto } from '@autoservice-app/contracts';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { DiagnosticForm } from '@/components/sto/forms/DiagnosticForm';
import { SaveBar } from '@/components/sto/forms/SaveBar';
import { InfoRow, StateBlock } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  calculateDiagnosticProgress,
  calculateDiagnosticTotals,
  createEmptyDiagnosticData,
  isLastDiagnosticCategory,
  nextDiagnosticCategoryId,
  withDiagnosticTotals,
} from '@/lib/diagnostic-form';
import {
  formatDateTime,
  getApiErrorMessage,
  stoQueryKeys,
  useCreateDiagnostic,
  useDiagnostics,
  useStoMe,
  useUpdateDiagnostic,
} from '@/lib/sto';

export default function DiagnosticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id ?? '';
  const auth = useAuth();
  const router = useRouter();
  const stoMe = useStoMe();
  const order = useQuery({
    queryKey: stoQueryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: () => auth.api.getWorkOrder(orderId),
  });
  const diagnostics = useDiagnostics(orderId);
  const activeDiagnostic = useMemo(() => newestDiagnostic(diagnostics.data?.items ?? []), [diagnostics.data?.items]);
  const [draft, setDraft] = useState<DiagnosticData | null>(null);
  const [activeDiagnosticId, setActiveDiagnosticId] = useState<string | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState('');
  const [currentCategoryId, setCurrentCategoryId] = useState(diagnosticTemplateV1.categories[0]?.id ?? 'front_suspension');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const createDiagnostic = useCreateDiagnostic(orderId);
  const updateDiagnostic = useUpdateDiagnostic(activeDiagnosticId ?? undefined, orderId);
  const sourceDraft = useMemo(() => {
    if (!order.data || !diagnostics.isSuccess) return null;
    if (activeDiagnostic) return withDiagnosticTotals(activeDiagnostic.dataJson, diagnosticTemplateV1);
    return null;
  }, [activeDiagnostic, diagnostics.isSuccess, order.data]);
  const draftFingerprint = useMemo(() => (draft ? JSON.stringify(draft) : ''), [draft]);
  const hasUnsavedChanges = Boolean(draft) && draftFingerprint !== savedFingerprint;
  const progress = draft
    ? calculateDiagnosticProgress(diagnosticTemplateV1, draft)
    : { filled: 0, total: 0, percent: 0 };
  const totals = draft ? calculateDiagnosticTotals(draft, diagnosticTemplateV1) : null;
  const isLastCategory = isLastDiagnosticCategory(diagnosticTemplateV1, currentCategoryId);
  const isSaving = createDiagnostic.isPending || updateDiagnostic.isPending;

  useEffect(() => {
    if (!sourceDraft || !activeDiagnostic) return;
    const nextFingerprint = JSON.stringify(sourceDraft);
    if (!draft || !hasUnsavedChanges || activeDiagnostic.id !== activeDiagnosticId) {
      setDraft(sourceDraft);
      setActiveDiagnosticId(activeDiagnostic.id);
      setSavedFingerprint(nextFingerprint);
    }
  }, [activeDiagnostic, activeDiagnosticId, draft, hasUnsavedChanges, sourceDraft]);

  const startNewDraft = () => {
    if (!order.data) return;
    const nextDraft = createEmptyDiagnosticData(diagnosticTemplateV1, order.data);
    setDraft(nextDraft);
    setActiveDiagnosticId(null);
    setSavedFingerprint('');
  };

  const handleSave = async (options: { exit?: boolean } = {}) => {
    if (!draft) return;
    const dataJson = withDiagnosticTotals(draft, diagnosticTemplateV1);
    const nextTotals = calculateDiagnosticTotals(dataJson, diagnosticTemplateV1);

    try {
      const saved = activeDiagnosticId
        ? await updateDiagnostic.mutateAsync({
            dataJson,
            otherRecommendations: dataJson.totals?.otherRecommendations ?? null,
            alignmentComment: dataJson.totals?.alignmentComment ?? null,
            partsTotal: nextTotals.partsTotal,
            serviceTotal: nextTotals.serviceTotal,
            grandTotal: nextTotals.grandTotal,
          })
        : await createDiagnostic.mutateAsync({
            dataJson,
            otherRecommendations: dataJson.totals?.otherRecommendations ?? null,
            alignmentComment: dataJson.totals?.alignmentComment ?? null,
            partsTotal: nextTotals.partsTotal,
            serviceTotal: nextTotals.serviceTotal,
            grandTotal: nextTotals.grandTotal,
          });

      const savedDraft = withDiagnosticTotals(saved.dataJson, diagnosticTemplateV1);
      setDraft(savedDraft);
      setActiveDiagnosticId(saved.id);
      setSavedFingerprint(JSON.stringify(savedDraft));
      setSavedAt(new Date().toISOString());

      if (options.exit) {
        router.replace(orderHref(orderId));
        return;
      }

      Alert.alert('Диагностика сохранена', 'Данные диагностики отправлены на backend.');
    } catch (error) {
      Alert.alert('Диагностика не сохранена', getDiagnosticErrorMessage(error));
    }
  };

  const handleExit = () => {
    if (!hasUnsavedChanges) {
      router.replace(orderHref(orderId));
      return;
    }

    Alert.alert('Есть несохраненные изменения', 'Сохранить диагностику перед выходом?', [
      { text: 'Остаться', style: 'cancel' },
      { text: 'Выйти без сохранения', style: 'destructive', onPress: () => router.replace(orderHref(orderId)) },
      { text: 'Сохранить', onPress: () => void handleSave({ exit: true }) },
    ]);
  };

  if (order.isPending || diagnostics.isPending || stoMe.isPending) {
    return <StateBlock title="Загружаем диагностику" />;
  }

  if (order.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Заказ-наряд не найден"
          description={getDiagnosticErrorMessage(order.error)}
          actionLabel="Повторить"
          onAction={() => void order.refetch()}
        />
      </Screen>
    );
  }

  if (diagnostics.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Диагностика не загрузилась"
          description={getDiagnosticErrorMessage(diagnostics.error)}
          actionLabel="Повторить"
          onAction={() => void diagnostics.refetch()}
        />
      </Screen>
    );
  }

  if (!draft) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Диагностика не заполнена"
          description={`${order.data.number} · ${order.data.vehicle.brandModel}`}
          actionLabel="Создать диагностику"
          onAction={startNewDraft}
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
            Диагностика
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
        <InfoRow label="Состояние" value={activeDiagnosticId ? 'Диагностика есть' : 'Новый черновик'} />
        <InfoRow label="Исполнитель" value={draft.totals?.executorName ?? stoMe.data?.staffProfile.fullName ?? '—'} />
        <InfoRow
          label="Последнее сохранение"
          value={
            savedAt
              ? formatDateTime(savedAt)
              : activeDiagnostic
                ? formatDateTime(activeDiagnostic.updatedAt)
                : '—'
          }
        />
        <InfoRow label="Итог" value={totals ? `${totals.grandTotal} ₽` : '—'} />
      </View>

      <DiagnosticForm
        template={diagnosticTemplateV1}
        data={draft}
        currentCategoryId={currentCategoryId}
        onChange={setDraft}
        onCategoryChange={setCurrentCategoryId}
      />

      <SaveBar
        dirty={hasUnsavedChanges}
        isLastSection={isLastCategory}
        nextLabel="Следующая категория"
        progress={progress}
        saving={isSaving}
        onNext={() => setCurrentCategoryId(nextDiagnosticCategoryId(diagnosticTemplateV1, currentCategoryId))}
        onSave={() => void handleSave()}
        onSaveExit={() => void handleSave({ exit: true })}
      />
    </Screen>
  );
}

function newestDiagnostic(items: DiagnosticDto[]) {
  return [...items].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;
}

function getDiagnosticErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) return 'Нет доступа к диагностике этого заказ-наряда.';
    if (error.status === 404) return 'Заказ-наряд или диагностика не найдены.';
    if (error.status === 400) return 'Проверьте заполнение формы диагностики.';
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
