import type { WorkOrderStatus } from '@autoservice-app/contracts';
import { Alert, StyleSheet, View } from 'react-native';

import { InfoRow, StateBlock, StatusBadge } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { ApiRequestError } from '@/lib/api';
import {
  getApiErrorMessage,
  useChangeWorkOrderStatus,
  useWorkOrderStatusActions,
  workOrderStatusLabels,
} from '@/lib/sto';

type WorkOrderStatusActionBarProps = {
  currentStatus?: WorkOrderStatus;
  orderId: string;
};

export function WorkOrderStatusActionBar({ currentStatus, orderId }: WorkOrderStatusActionBarProps) {
  const statusActions = useWorkOrderStatusActions(orderId);
  const changeStatus = useChangeWorkOrderStatus(orderId);
  const activeStatus = statusActions.data?.currentStatus ?? currentStatus;
  const allowedStatuses = statusActions.data?.allowedStatuses ?? [];
  const isBusy = statusActions.isPending || changeStatus.isPending;

  const submitStatus = (status: WorkOrderStatus) => {
    const run = () => {
      changeStatus.mutate(
        { status },
        {
          onSuccess: (updated) => {
            Alert.alert('Статус изменен', workOrderStatusLabels[updated.status]);
          },
          onError: (error) => {
            Alert.alert('Статус не изменен', getStatusActionErrorMessage(error));
          },
        },
      );
    };

    if (status === 'CANCELLED' || status === 'CLOSED') {
      Alert.alert('Подтвердите смену статуса', `Перевести заказ в "${workOrderStatusLabels[status]}"?`, [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Подтвердить', style: status === 'CANCELLED' ? 'destructive' : 'default', onPress: run },
      ]);
      return;
    }

    run();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Typography variant="h4" weight="700">
            Статус заказа
          </Typography>
          {statusActions.data ? (
            <InfoRow label="Роль" value={statusActions.data.role} />
          ) : (
            <Typography muted variant="bodySm">
              Проверяем доступные действия
            </Typography>
          )}
        </View>
        {activeStatus ? <StatusBadge status={activeStatus} /> : null}
      </View>

      {statusActions.isError ? (
        <StateBlock
          title="Статусы недоступны"
          description={getStatusActionErrorMessage(statusActions.error)}
          actionLabel="Повторить"
          onAction={() => void statusActions.refetch()}
        />
      ) : (
        <View style={styles.actions}>
          {allowedStatuses.length > 0 ? (
            allowedStatuses.map((status) => (
              <Button
                key={status}
                disabled={isBusy}
                loading={changeStatus.isPending && changeStatus.variables?.status === status}
                size="sm"
                variant="outline"
                onPress={() => submitStatus(status)}>
                {workOrderStatusLabels[status]}
              </Button>
            ))
          ) : (
            <Typography muted>
              {statusActions.isPending ? 'Загружаем доступные переходы...' : 'Для вашей роли нет доступных переходов.'}
            </Typography>
          )}
        </View>
      )}
    </View>
  );
}

function getStatusActionErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 400) return 'Некорректный статус или запрос. Обновите заказ и попробуйте снова.';
    if (error.status === 403) return 'Для вашей роли нет прав на этот переход статуса.';
    if (error.status === 404) return 'Заказ не найден или уже недоступен.';
  }

  return getApiErrorMessage(error);
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  container: {
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.half,
  },
});
