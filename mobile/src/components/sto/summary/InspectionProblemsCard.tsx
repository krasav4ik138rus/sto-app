import type { WorkOrderSummaryDto } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { SummarySectionCard } from './SummarySectionCard';
import {
  inspectionConditionLabels,
  inspectionProblemLabel,
  inspectionProblemSection,
} from './summary-utils';

export function InspectionProblemsCard({
  problems,
}: {
  problems: NonNullable<WorkOrderSummaryDto['inspectionProblemItems']>;
}) {
  return (
    <SummarySectionCard title="Проблемы по акту">
      {problems.length === 0 ? (
        <Typography muted>Проблем по акту не отмечено.</Typography>
      ) : (
        <View style={styles.list}>
          {problems.map((item) => (
            <View key={`${item.fieldKey}:${item.value}`} style={styles.row}>
              <View style={styles.rowHeader}>
                <Typography weight="800">{inspectionProblemLabel(item)}</Typography>
                <Badge variant={item.value === 'urgent' ? 'destructive' : 'outline'}>
                  {inspectionConditionLabels[item.value]}
                </Badge>
              </View>
              {inspectionProblemSection(item) ? (
                <Typography muted variant="bodySm">
                  {inspectionProblemSection(item)}
                </Typography>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </SummarySectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    gap: Spacing.one,
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
});
