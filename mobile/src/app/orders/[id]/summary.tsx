import type { OrderAttachmentDto } from '@autoservice-app/contracts';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Modal, RefreshControl, StyleSheet, View } from 'react-native';

import { AttachmentsSummaryCard } from '@/components/sto/summary/AttachmentsSummaryCard';
import { CustomerVehicleCard } from '@/components/sto/summary/CustomerVehicleCard';
import { DiagnosticProblemsCard } from '@/components/sto/summary/DiagnosticProblemsCard';
import { InspectionProblemsCard } from '@/components/sto/summary/InspectionProblemsCard';
import { RecommendationsSummaryCard } from '@/components/sto/summary/RecommendationsSummaryCard';
import { SummaryActionsCard } from '@/components/sto/summary/SummaryActionsCard';
import { SummaryHeaderCard } from '@/components/sto/summary/SummaryHeaderCard';
import { TotalsCard } from '@/components/sto/summary/TotalsCard';
import { InfoRow, StateBlock } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { attachmentLinkLabel, attachmentTypeLabels, formatBytes } from '@/lib/attachments';
import { useAuth } from '@/lib/auth';
import { formatDateTime, getApiErrorMessage, stoQueryKeys, useAttachments, useWorkOrderSummary } from '@/lib/sto';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id ?? '';
  const auth = useAuth();
  const router = useRouter();
  const summary = useWorkOrderSummary(orderId);
  const attachments = useAttachments(orderId);
  const order = useQuery({
    queryKey: stoQueryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: () => auth.api.getWorkOrder(orderId),
  });
  const [selectedAttachment, setSelectedAttachment] = useState<OrderAttachmentDto | null>(null);
  const refreshing = summary.isFetching || order.isFetching || attachments.isFetching;

  const refetchAll = () => {
    void summary.refetch();
    void order.refetch();
    void attachments.refetch();
  };

  const openRoute = (route: 'attachments' | 'diagnostics' | 'inspection' | 'recommendations' | '') => {
    router.push(`/orders/${orderId}${route ? `/${route}` : ''}` as Href);
  };

  if (summary.isPending || order.isPending || attachments.isPending) {
    return <StateBlock title="Загружаем сводку" />;
  }

  if (summary.isError || order.isError || attachments.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Сводка не загрузилась"
          description={getApiErrorMessage(summary.error ?? order.error ?? attachments.error)}
          actionLabel="Повторить"
          onAction={refetchAll}
        />
      </Screen>
    );
  }

  const summaryData = summary.data;
  const orderData = order.data;
  const attachmentItems = attachments.data?.items ?? [];

  return (
    <Screen
      backButton="auto"
      backFallbackHref={orderHref(orderId)}
      scroll
      scrollViewProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={refetchAll} />,
      }}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Typography variant="h2" weight="800">
            Сводка
          </Typography>
          <Typography muted>
            {orderData.number} · {orderData.vehicle.brandModel}
          </Typography>
        </View>
        <Button variant="outline" onPress={() => openRoute('')}>
          Заказ
        </Button>
      </View>

      <SummaryHeaderCard order={orderData} summary={summaryData} />
      <CustomerVehicleCard order={orderData} summary={summaryData} />
      <InspectionProblemsCard problems={summaryData.inspectionProblemItems ?? []} />
      <DiagnosticProblemsCard
        attachments={attachmentItems}
        fileHeaders={auth.api.getAttachmentFileHeaders()}
        getFileUrl={(attachmentId) => auth.api.getAttachmentFileUrl(attachmentId)}
        problems={summaryData.diagnosticProblemItems ?? []}
        onOpenAttachment={setSelectedAttachment}
        onOpenAttachmentsScreen={() => openRoute('attachments')}
      />
      <RecommendationsSummaryCard recommendations={summaryData.recommendations ?? []} />
      <AttachmentsSummaryCard
        attachments={attachmentItems}
        count={summaryData.attachmentsCount}
        onOpenAttachments={() => openRoute('attachments')}
      />
      <TotalsCard summary={summaryData} />
      <SummaryActionsCard
        onOpenAttachments={() => openRoute('attachments')}
        onOpenDiagnostics={() => openRoute('diagnostics')}
        onOpenInspection={() => openRoute('inspection')}
        onOpenOrder={() => openRoute('')}
        onOpenRecommendations={() => openRoute('recommendations')}
      />

      <AttachmentPreviewModal
        attachment={selectedAttachment}
        fileHeaders={auth.api.getAttachmentFileHeaders()}
        fileUrl={selectedAttachment ? auth.api.getAttachmentFileUrl(selectedAttachment.id) : undefined}
        onClose={() => setSelectedAttachment(null)}
      />
    </Screen>
  );
}

function AttachmentPreviewModal({
  attachment,
  fileHeaders,
  fileUrl,
  onClose,
}: {
  attachment: OrderAttachmentDto | null;
  fileHeaders: Record<string, string>;
  fileUrl?: string;
  onClose: () => void;
}) {
  if (!attachment) return null;

  const imageUri = attachment.type === 'PHOTO' ? fileUrl ?? attachment.fileUrl ?? undefined : undefined;
  const title = attachment.caption || attachment.originalFilename || attachmentTypeLabels[attachment.type];

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible onRequestClose={onClose}>
      <Screen scroll>
        <View style={styles.modalHeader}>
          <View style={styles.titleBlock}>
            <Typography variant="h3" weight="800">
              {title}
            </Typography>
            <Typography muted>{attachmentLinkLabel(attachment)}</Typography>
          </View>
          <Button variant="outline" onPress={onClose}>
            Закрыть
          </Button>
        </View>

        {imageUri ? (
          <Image contentFit="contain" source={{ headers: fileHeaders, uri: imageUri }} style={styles.fullPreview} />
        ) : (
          <StateBlock title={attachmentTypeLabels[attachment.type]} description="Просмотр этого типа файла будет добавлен позже." />
        )}

        <View style={styles.metaGrid}>
          <InfoRow label="Файл" value={attachment.originalFilename ?? '—'} />
          <InfoRow label="MIME" value={attachment.mimeType ?? '—'} />
          <InfoRow label="Размер" value={formatBytes(attachment.byteSize)} />
          <InfoRow label="Создан" value={formatDateTime(attachment.createdAt)} />
        </View>
      </Screen>
    </Modal>
  );
}

function orderHref(orderId: string) {
  return `/orders/${orderId}` as Href;
}

const styles = StyleSheet.create({
  fullPreview: {
    backgroundColor: '#111827',
    borderRadius: 8,
    height: 420,
    width: '100%',
  },
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
  modalHeader: {
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
