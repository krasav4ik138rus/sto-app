import type { DiagnosticDto, RecommendationDto, RecommendationStatus } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/sto';
import {
  diagnosticLabel,
  formatMoney,
  nextRecommendationStatuses,
  recommendationStatusLabels,
  shortId,
} from '@/lib/recommendations';
import type { StaffRole } from '@autoservice-app/contracts';

type RecommendationCardProps = {
  recommendation: RecommendationDto;
  diagnostic?: DiagnosticDto;
  role: StaffRole | undefined;
  canEdit: boolean;
  updatingStatus?: RecommendationStatus;
  onEdit: () => void;
  onStatusChange: (status: RecommendationStatus) => void;
};

export function RecommendationCard({
  recommendation,
  diagnostic,
  role,
  canEdit,
  updatingStatus,
  onEdit,
  onStatusChange,
}: RecommendationCardProps) {
  const colors = useTheme();
  const statusActions = nextRecommendationStatuses(recommendation.status, role);

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.backgroundElement }]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Typography variant="bodyLg" weight="800">
            {recommendation.text}
          </Typography>
          <Typography muted variant="bodySm">
            #{shortId(recommendation.id)}
          </Typography>
        </View>
        <RecommendationStatusBadge status={recommendation.status} />
      </View>

      <View style={styles.grid}>
        <InfoRow label="Запчасти" value={formatMoney(recommendation.partsPrice)} />
        <InfoRow label="Работы" value={formatMoney(recommendation.servicePrice)} />
        <InfoRow label="Итого" value={formatMoney(recommendation.totalPrice)} />
        <InfoRow
          label="Диагностика"
          value={recommendation.diagnosticId ? diagnosticLabel(diagnostic) : 'Без связи'}
        />
        <InfoRow label="Акт осмотра" value={recommendation.inspectionActId ? 'Связан' : 'Без связи'} />
        <InfoRow label="Создано" value={formatDateTime(recommendation.createdAt)} />
        <InfoRow label="Обновлено" value={formatDateTime(recommendation.updatedAt)} />
      </View>

      <View style={styles.actions}>
        {canEdit ? (
          <Button size="sm" variant="outline" onPress={onEdit}>
            Изменить
          </Button>
        ) : null}
        {statusActions.map((status) => (
          <Button
            key={status}
            loading={updatingStatus === status}
            size="sm"
            variant={status === 'DECLINED' ? 'destructive' : 'outline'}
            onPress={() => onStatusChange(status)}>
            {recommendationStatusLabels[status]}
          </Button>
        ))}
      </View>
    </View>
  );
}

function RecommendationStatusBadge({ status }: { status: RecommendationStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: statusColor(status) }]}>
      <Typography colorValue="#fff" variant="caption" weight="700">
        {recommendationStatusLabels[status]}
      </Typography>
    </View>
  );
}

function statusColor(status: RecommendationStatus) {
  switch (status) {
    case 'SUGGESTED':
      return '#2563eb';
    case 'APPROVED':
      return '#0891b2';
    case 'DECLINED':
      return '#dc2626';
    case 'DONE':
      return '#16a34a';
  }
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    padding: Spacing.three,
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
  titleBlock: {
    flex: 1,
    gap: Spacing.one,
  },
});
