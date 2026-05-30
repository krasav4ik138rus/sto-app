import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StaffRole, WorkOrderStatus } from '@autoservice-app/contracts';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { InfoRow, StateBlock, StatusBadge } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatDateTime, getApiErrorMessage, stoQueryKeys, useStoMe, workOrderStatusLabels, workOrderStatuses } from '@/lib/sto';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const stoMe = useStoMe();
  const order = useQuery({
    queryKey: stoQueryKeys.order(id),
    enabled: Boolean(id),
    queryFn: () => auth.api.getWorkOrder(id),
  });

  const changeStatus = useMutation({
    mutationFn: (status: WorkOrderStatus) => auth.api.changeWorkOrderStatus(id, { status }),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stoQueryKeys.order(id) }),
        queryClient.invalidateQueries({ queryKey: ['sto', 'orders'] }),
      ]);
      Alert.alert('Статус изменен', workOrderStatusLabels[updated.status]);
    },
    onError: (error) => Alert.alert('Статус не изменен', getApiErrorMessage(error)),
  });

  if (order.isPending) {
    return <StateBlock title="Загружаем заказ" />;
  }

  if (order.isError) {
    return (
      <Screen backButton="auto" backFallbackHref="/orders" centered>
        <StateBlock
          title="Заказ не загрузился"
          description={getApiErrorMessage(order.error)}
          actionLabel="Повторить"
          onAction={() => void order.refetch()}
        />
      </Screen>
    );
  }

  const data = order.data;

  return (
    <Screen backButton="auto" backFallbackHref="/orders" scroll>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Typography variant="h2" weight="800">
            {data.number}
          </Typography>
          <Typography muted>{data.vehicle.brandModel}</Typography>
        </View>
        <StatusBadge status={data.status} />
      </View>

      <View style={styles.section}>
        <Typography variant="h4" weight="700">
          Данные заказа
        </Typography>
        <View style={styles.grid}>
          <InfoRow label="Клиент" value={data.customer?.name ?? data.customer?.phone ?? '—'} />
          <InfoRow label="Госномер" value={data.vehicle.plate ?? '—'} />
          <InfoRow label="VIN" value={data.vehicle.vin ?? '—'} />
          <InfoRow label="Пробег" value={data.mileage ? `${data.mileage} км` : '—'} />
          <InfoRow label="Ответственный" value={data.responsibleStaffProfile?.fullName ?? '—'} />
          <InfoRow label="Создал" value={data.createdByStaffProfile.fullName ?? '—'} />
          <InfoRow label="СТО" value={data.serviceCenter?.name ?? '—'} />
          <InfoRow label="Создан" value={formatDateTime(data.createdAt)} />
        </View>
        <InfoRow label="Причина обращения" value={data.visitReason ?? '—'} />
      </View>

      <View style={styles.section}>
        <Typography variant="h4" weight="700">
          Быстрые действия
        </Typography>
        <View style={styles.actions}>
          {['inspection', 'diagnostics', 'recommendations', 'attachments', 'summary'].map((route) => (
            <Button key={route} variant="outline" onPress={() => router.push(`/orders/${id}/${route}` as Href)}>
              {actionLabel(route, data.inspectionAct !== null)}
            </Button>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="h4" weight="700">
          Сменить статус
        </Typography>
        <View style={styles.actions}>
          {statusOptions(stoMe.data?.role).map((status) => (
            <Button
              key={status}
              disabled={status === data.status || changeStatus.isPending}
              loading={changeStatus.isPending && changeStatus.variables === status}
              size="sm"
              variant={status === data.status ? 'default' : 'outline'}
              onPress={() => changeStatus.mutate(status)}>
              {workOrderStatusLabels[status]}
            </Button>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="h4" weight="700">
          История статусов
        </Typography>
        {data.statusHistory.map((history) => (
          <View key={history.id} style={styles.historyRow}>
            <Typography weight="700">{workOrderStatusLabels[history.toStatus]}</Typography>
            <Typography muted variant="bodySm">
              {formatDateTime(history.createdAt)} · {history.comment ?? 'Без комментария'}
            </Typography>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function statusOptions(role: StaffRole | undefined) {
  if (role === 'MECHANIC') {
    return ['IN_PROGRESS', 'AWAITING_APPROVAL'] as const;
  }

  return workOrderStatuses;
}

function actionLabel(route: string, inspectionCompleted: boolean) {
  switch (route) {
    case 'inspection':
      return inspectionCompleted ? 'Акт заполнен' : 'Акт не заполнен';
    case 'diagnostics':
      return 'Диагностика';
    case 'recommendations':
      return 'Рекомендации';
    case 'attachments':
      return 'Фото/файлы';
    case 'summary':
      return 'Сводка';
    default:
      return route;
  }
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  historyRow: {
    gap: Spacing.half,
    paddingVertical: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.one,
  },
});
