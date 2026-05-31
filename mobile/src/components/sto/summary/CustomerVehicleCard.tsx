import type { WorkOrderDetailDto, WorkOrderSummaryDto } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/sto-ui';
import { Spacing } from '@/constants/theme';
import { SummarySectionCard } from './SummarySectionCard';

export function CustomerVehicleCard({
  order,
  summary,
}: {
  order?: WorkOrderDetailDto;
  summary: WorkOrderSummaryDto;
}) {
  const orderCore = order ?? summary.order;
  const customer = order?.customer ?? summary.customer ?? null;
  const vehicle = order?.vehicle ?? summary.vehicle;

  return (
    <SummarySectionCard title="Клиент и автомобиль">
      <View style={styles.grid}>
        <InfoRow label="Клиент" value={customer?.name ?? '—'} />
        <InfoRow label="Телефон" value={customer?.phone ?? '—'} />
        <InfoRow label="Автомобиль" value={vehicle?.brandModel ?? '—'} />
        <InfoRow label="VIN" value={vehicle?.vin ?? '—'} />
        <InfoRow label="Госномер" value={vehicle?.plate ?? '—'} />
        <InfoRow label="Пробег" value={orderCore?.mileage ? `${orderCore.mileage} км` : '—'} />
      </View>
      <InfoRow label="Причина обращения" value={orderCore?.visitReason ?? '—'} />
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
