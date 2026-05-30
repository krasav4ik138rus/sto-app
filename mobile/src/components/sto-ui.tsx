import type { WorkOrderListItemDto, WorkOrderStatus } from '@autoservice-app/contracts';
import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, workOrderStatusLabels } from '@/lib/sto';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Typography } from './ui/typography';

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const colors = useTheme();
  return (
    <View style={[styles.status, { backgroundColor: statusColor(status), borderColor: colors.backgroundElement }]}>
      <Typography colorValue="#fff" variant="caption" weight="700">
        {workOrderStatusLabels[status]}
      </Typography>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Typography muted variant="caption">
        {label}
      </Typography>
      <Typography variant="bodySm" weight="600" style={styles.infoValue}>
        {value ?? '—'}
      </Typography>
    </View>
  );
}

export function StateBlock({
  title,
  description,
  actionLabel,
  loading,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  loading?: boolean;
  onAction?: () => void;
}) {
  return (
    <View style={styles.stateBlock}>
      <Typography align="center" variant="h4" weight="700">
        {title}
      </Typography>
      {description ? (
        <Typography align="center" muted>
          {description}
        </Typography>
      ) : null}
      {actionLabel && onAction ? (
        <Button loading={loading} variant="outline" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

export function OrderCard({ order }: { order: WorkOrderListItemDto }) {
  const router = useRouter();
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/orders/${order.id}` as Href)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.backgroundElement,
          opacity: pressed ? 0.72 : 1,
        },
      ]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Typography variant="h4" weight="800">
            {order.number}
          </Typography>
          <Typography muted variant="bodySm">
            {order.vehicle.brandModel}
          </Typography>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.grid}>
        <InfoRow label="Госномер" value={order.vehicle.plate ?? '—'} />
        <InfoRow label="VIN" value={order.vehicle.vin ?? '—'} />
        <InfoRow label="Пробег" value={order.mileage ? `${order.mileage} км` : '—'} />
        <InfoRow label="Клиент" value={order.customer?.name ?? order.customer?.phone ?? '—'} />
        <InfoRow label="Ответственный" value={order.responsibleStaffProfile?.fullName ?? '—'} />
        <InfoRow label="Обновлен" value={formatDateTime(order.updatedAt)} />
      </View>

      <View style={styles.indicators}>
        <Badge variant="outline">Акт</Badge>
        <Badge variant="outline">Диагностика</Badge>
        <Badge variant="outline">Рекомендации</Badge>
        <Badge variant="outline">Фото</Badge>
      </View>
    </Pressable>
  );
}

function statusColor(status: WorkOrderStatus) {
  switch (status) {
    case 'OPEN':
      return '#2563eb';
    case 'IN_PROGRESS':
      return '#7c3aed';
    case 'AWAITING_APPROVAL':
      return '#d97706';
    case 'APPROVED':
      return '#0891b2';
    case 'COMPLETED':
      return '#16a34a';
    case 'CLOSED':
      return '#475569';
    case 'CANCELLED':
      return '#dc2626';
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  cardTitleBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  indicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  infoRow: {
    flexBasis: '48%',
    gap: Spacing.half,
    minWidth: 130,
  },
  infoValue: {
    flexShrink: 1,
  },
  stateBlock: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  status: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
