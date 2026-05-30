import type { CreateRecommendationInput, RecommendationDto, UpdateRecommendationInput } from '@autoservice-app/contracts';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { RecommendationCard } from '@/components/sto/recommendations/RecommendationCard';
import { RecommendationForm, type RecommendationFormState } from '@/components/sto/recommendations/RecommendationForm';
import { RecommendationSummaryCard } from '@/components/sto/recommendations/RecommendationSummaryCard';
import { InfoRow, StateBlock } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  calculateRecommendationsSummary,
  canEditRecommendation,
  canManageRecommendationStatus,
  parseMoneyInput,
  recommendationStatusLabels,
} from '@/lib/recommendations';
import {
  formatDateTime,
  getApiErrorMessage,
  stoQueryKeys,
  useCreateRecommendation,
  useDiagnostics,
  useRecommendations,
  useStoMe,
  useUpdateRecommendation,
} from '@/lib/sto';

export default function RecommendationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id ?? '';
  const router = useRouter();
  const auth = useAuth();
  const stoMe = useStoMe();
  const order = useQuery({
    queryKey: stoQueryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: () => auth.api.getWorkOrder(orderId),
  });
  const recommendations = useRecommendations(orderId);
  const diagnostics = useDiagnostics(orderId);
  const createRecommendation = useCreateRecommendation(orderId);
  const updateRecommendation = useUpdateRecommendation(orderId);
  const [formState, setFormState] = useState<RecommendationFormState | null>(null);

  const items = recommendations.data?.items ?? [];
  const diagnosticItems = diagnostics.data?.items ?? [];
  const diagnosticsById = useMemo(
    () => new Map(diagnosticItems.map((diagnostic) => [diagnostic.id, diagnostic])),
    [diagnosticItems],
  );
  const summary = useMemo(() => calculateRecommendationsSummary(items), [items]);
  const role = stoMe.data?.role;
  const staffProfileId = stoMe.data?.staffProfile.id;
  const isSaving = createRecommendation.isPending || updateRecommendation.isPending;

  const startCreate = () => {
    setFormState({
      text: '',
      partsPrice: '',
      servicePrice: '',
      diagnosticId: null,
      inspectionActId: null,
      status: 'SUGGESTED',
    });
  };

  const startEdit = (recommendation: RecommendationDto) => {
    setFormState({
      id: recommendation.id,
      text: recommendation.text,
      partsPrice: recommendation.partsPrice ?? '',
      servicePrice: recommendation.servicePrice ?? '',
      diagnosticId: recommendation.diagnosticId,
      inspectionActId: recommendation.inspectionActId,
      status: recommendation.status,
    });
  };

  const handleSubmit = async () => {
    if (!formState) return;

    const text = formState.text.trim();
    if (!text) {
      Alert.alert('Рекомендация не сохранена', 'Заполните текст рекомендации.');
      return;
    }

    const partsPrice = parseMoneyInput(formState.partsPrice, 'Запчасти');
    if (!partsPrice.ok) {
      Alert.alert('Рекомендация не сохранена', partsPrice.message);
      return;
    }

    const servicePrice = parseMoneyInput(formState.servicePrice, 'Работы');
    if (!servicePrice.ok) {
      Alert.alert('Рекомендация не сохранена', servicePrice.message);
      return;
    }

    try {
      if (formState.id) {
        const input: UpdateRecommendationInput = {
          diagnosticId: formState.diagnosticId,
          inspectionActId: formState.inspectionActId,
          text,
          partsPrice: partsPrice.value,
          servicePrice: servicePrice.value,
        };

        if (canManageRecommendationStatus(role)) {
          input.status = formState.status;
        }

        await updateRecommendation.mutateAsync({ recommendationId: formState.id, input });
        Alert.alert('Рекомендация сохранена', 'Изменения отправлены на backend.');
      } else {
        const input: CreateRecommendationInput = {
          diagnosticId: formState.diagnosticId,
          inspectionActId: formState.inspectionActId,
          text,
          status: 'SUGGESTED',
          partsPrice: partsPrice.value,
          servicePrice: servicePrice.value,
        };

        await createRecommendation.mutateAsync(input);
        Alert.alert('Рекомендация создана', 'Новая рекомендация добавлена к заказ-наряду.');
      }

      setFormState(null);
    } catch (error) {
      Alert.alert('Рекомендация не сохранена', getRecommendationErrorMessage(error));
    }
  };

  const handleStatusChange = async (recommendation: RecommendationDto, status: RecommendationDto['status']) => {
    try {
      await updateRecommendation.mutateAsync({
        recommendationId: recommendation.id,
        input: { status },
      });
      Alert.alert('Статус изменен', recommendationStatusLabels[status]);
    } catch (error) {
      Alert.alert('Статус не изменен', getRecommendationErrorMessage(error));
    }
  };

  const handleBack = () => {
    router.replace(orderHref(orderId));
  };

  if (order.isPending || recommendations.isPending || diagnostics.isPending || stoMe.isPending) {
    return <StateBlock title="Загружаем рекомендации" />;
  }

  if (order.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Заказ-наряд не найден"
          description={getRecommendationErrorMessage(order.error)}
          actionLabel="Повторить"
          onAction={() => void order.refetch()}
        />
      </Screen>
    );
  }

  if (recommendations.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Рекомендации не загрузились"
          description={getRecommendationErrorMessage(recommendations.error)}
          actionLabel="Повторить"
          onAction={() => void recommendations.refetch()}
        />
      </Screen>
    );
  }

  if (diagnostics.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Диагностика не загрузилась"
          description={getRecommendationErrorMessage(diagnostics.error)}
          actionLabel="Повторить"
          onAction={() => void diagnostics.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboardAvoiding scroll scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Typography variant="h2" weight="800">
            Рекомендации
          </Typography>
          <Typography muted>
            {order.data.number} · {order.data.vehicle.brandModel}
          </Typography>
        </View>
        <Button variant="outline" onPress={handleBack}>
          Назад
        </Button>
      </View>

      <View style={styles.metaGrid}>
        <InfoRow label="Клиент" value={order.data.customer?.name ?? order.data.customer?.phone ?? '—'} />
        <InfoRow label="Госномер" value={order.data.vehicle.plate ?? '—'} />
        <InfoRow label="VIN" value={order.data.vehicle.vin ?? '—'} />
        <InfoRow label="Последнее обновление" value={formatDateTime(order.data.updatedAt)} />
      </View>

      <RecommendationSummaryCard summary={summary} />

      {formState ? (
        <RecommendationForm
          diagnostics={diagnosticItems}
          inspectionActId={order.data.inspectionAct?.id ?? null}
          mode={formState.id ? 'edit' : 'create'}
          saving={isSaving}
          showStatusSelect={Boolean(formState.id) && canManageRecommendationStatus(role)}
          state={formState}
          onCancel={() => setFormState(null)}
          onChange={setFormState}
          onSubmit={() => void handleSubmit()}
        />
      ) : (
        <Button onPress={startCreate}>Добавить рекомендацию</Button>
      )}

      <View style={styles.section}>
        <Typography variant="h4" weight="800">
          Список
        </Typography>
        {items.length === 0 ? (
          <StateBlock
            title="Рекомендаций пока нет"
            description="Добавьте работы или запчасти, которые нужно согласовать по этому заказ-наряду."
          />
        ) : (
          items.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              canEdit={canEditRecommendation(recommendation, role, staffProfileId)}
              diagnostic={recommendation.diagnosticId ? diagnosticsById.get(recommendation.diagnosticId) : undefined}
              recommendation={recommendation}
              role={role}
              updatingStatus={
                updateRecommendation.isPending &&
                updateRecommendation.variables?.recommendationId === recommendation.id
                  ? updateRecommendation.variables.input.status
                  : undefined
              }
              onEdit={() => startEdit(recommendation)}
              onStatusChange={(status) => void handleStatusChange(recommendation, status)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

function getRecommendationErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) return 'Нет доступа к рекомендациям этого заказ-наряда.';
    if (error.status === 404) return 'Заказ-наряд или рекомендация не найдены.';
    if (error.status === 400 || error.status === 409) return 'Проверьте данные рекомендации.';
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
  section: {
    gap: Spacing.two,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.one,
  },
});
