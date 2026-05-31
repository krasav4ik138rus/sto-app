import type { WorkOrderDetailDto, WorkOrderSummaryDto } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { InfoRow, StatusBadge } from '@/components/sto-ui';
import { Spacing } from '@/constants/theme';
import { formatDateTime } from '@/lib/sto';
import { SummarySectionCard } from './SummarySectionCard';

export function SummaryHeaderCard({
  order,
  summary,
}: {
  order?: WorkOrderDetailDto;
  summary: WorkOrderSummaryDto;
}) {
  const orderCore = order ?? summary.order;

  return (
    <SummarySectionCard title={orderCore?.number ?? 'Заказ-наряд'} action={<StatusBadge status={summary.status} />}>
      <View style={styles.grid}>
        <InfoRow label="Создан" value={formatDateTime(orderCore?.createdAt)} />
        <InfoRow label="Обновлен" value={formatDateTime(orderCore?.updatedAt)} />
        <InfoRow label="СТО" value={summary.serviceCenter?.name ?? order?.serviceCenter?.name ?? '—'} />
        <InfoRow label="Ответственный" value={order?.responsibleStaffProfile?.fullName ?? '—'} />
        <InfoRow label="Создал" value={order?.createdByStaffProfile.fullName ?? '—'} />
        <InfoRow label="Статус акта" value={summary.inspectionCompleted ? 'Акт заполнен' : 'Акт не заполнен'} />
      </View>
    </SummarySectionCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
