import type {
  AttachmentType,
  AttachmentVisibility,
  CreateAttachmentMetadataInput,
} from '@autoservice-app/contracts';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AddAttachmentPanel } from '@/components/sto/attachments/AddAttachmentPanel';
import { AttachmentCard } from '@/components/sto/attachments/AttachmentCard';
import { InfoRow, StateBlock } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import {
  diagnosticAttachmentLabel,
  filenameFromUri,
  generateDevStorageKey,
  recommendationAttachmentLabel,
  type AttachmentLinkTarget,
  type LocalAttachmentDraft,
} from '@/lib/attachments';
import { ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  formatDateTime,
  getApiErrorMessage,
  stoQueryKeys,
  useAttachments,
  useCreateAttachmentMetadata,
  useDeleteAttachment,
  useDiagnostics,
  useInspection,
  useRecommendations,
  useStoMe,
} from '@/lib/sto';

const orderOnlyTargetId = 'order';

export default function AttachmentsScreen() {
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
  const attachments = useAttachments(orderId);
  const inspection = useInspection(orderId);
  const diagnostics = useDiagnostics(orderId);
  const recommendations = useRecommendations(orderId);
  const createAttachment = useCreateAttachmentMetadata(orderId);
  const deleteAttachment = useDeleteAttachment(orderId);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<LocalAttachmentDraft | null>(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<AttachmentVisibility>('INTERNAL');
  const [linkTargetId, setLinkTargetId] = useState(orderOnlyTargetId);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

  const linkTargets = useMemo(
    () =>
      buildLinkTargets({
        diagnostics: diagnostics.data?.items ?? [],
        inspectionActId: inspection.data?.inspectionAct?.id ?? order.data?.inspectionAct?.id ?? null,
        recommendations: recommendations.data?.items ?? [],
      }),
    [
      diagnostics.data?.items,
      inspection.data?.inspectionAct?.id,
      order.data?.inspectionAct?.id,
      recommendations.data?.items,
    ],
  );

  const resetForm = () => {
    setDraft(null);
    setCaption('');
    setVisibility('INTERNAL');
    setLinkTargetId(orderOnlyTargetId);
    setIsAdding(false);
  };

  const handlePickPhoto = async () => {
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset) {
      setDraft(imageAssetToDraft(asset, 'PHOTO'));
    }
  };

  const handleTakePhoto = async () => {
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset) {
      setDraft(imageAssetToDraft(asset, 'PHOTO'));
    }
  };

  const handlePickVideo = async () => {
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ['videos'],
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset) {
      setDraft(imageAssetToDraft(asset, 'VIDEO'));
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: '*/*',
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset) {
      setDraft({
        type: 'DOCUMENT',
        uri: asset.uri,
        originalFilename: asset.name,
        mimeType: asset.mimeType ?? null,
        byteSize: asset.size ?? null,
      });
    }
  };

  const handleSubmit = async () => {
    if (!draft) {
      Alert.alert('Файл не выбран', 'Сначала выберите фото, видео или документ.');
      return;
    }

    const target = linkTargets.find((item) => item.id === linkTargetId) ?? linkTargets[0];
    const input: CreateAttachmentMetadataInput = {
      type: draft.type,
      visibility,
      storageKey: generateDevStorageKey(orderId, draft.originalFilename),
      fileUrl: null,
      originalFilename: draft.originalFilename,
      mimeType: draft.mimeType,
      byteSize: draft.byteSize,
      caption: caption.trim() || null,
      inspectionActId: target.inspectionActId ?? null,
      diagnosticId: target.diagnosticId ?? null,
      recommendationId: target.recommendationId ?? null,
    };

    try {
      const saved = await createAttachment.mutateAsync(input);
      if (draft.type === 'PHOTO') {
        setLocalPreviews((current) => ({ ...current, [saved.id]: draft.uri }));
      }
      resetForm();
      Alert.alert('Файл добавлен', 'Сохранена metadata-запись без загрузки файла в облако.');
    } catch (error) {
      Alert.alert('Файл не сохранен', getAttachmentErrorMessage(error));
    }
  };

  const handleDelete = (attachmentId: string) => {
    Alert.alert('Удалить файл?', 'Metadata-запись будет помечена как удаленная.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void deleteAttachment
            .mutateAsync(attachmentId)
            .then(() => {
              setLocalPreviews((current) => {
                const next = { ...current };
                delete next[attachmentId];
                return next;
              });
            })
            .catch((error) => Alert.alert('Файл не удален', getAttachmentErrorMessage(error)));
        },
      },
    ]);
  };

  const handleBack = () => router.replace(orderHref(orderId));

  if (
    order.isPending ||
    attachments.isPending ||
    inspection.isPending ||
    diagnostics.isPending ||
    recommendations.isPending ||
    stoMe.isPending
  ) {
    return <StateBlock title="Загружаем фото и файлы" />;
  }

  if (order.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Заказ-наряд не найден"
          description={getAttachmentErrorMessage(order.error)}
          actionLabel="Повторить"
          onAction={() => void order.refetch()}
        />
      </Screen>
    );
  }

  if (attachments.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Файлы не загрузились"
          description={getAttachmentErrorMessage(attachments.error)}
          actionLabel="Повторить"
          onAction={() => void attachments.refetch()}
        />
      </Screen>
    );
  }

  if (inspection.isError || diagnostics.isError || recommendations.isError) {
    return (
      <Screen backButton="auto" backFallbackHref={orderHref(orderId)} centered>
        <StateBlock
          title="Связи для файлов не загрузились"
          description={getAttachmentErrorMessage(inspection.error ?? diagnostics.error ?? recommendations.error)}
          actionLabel="Повторить"
          onAction={() => {
            void inspection.refetch();
            void diagnostics.refetch();
            void recommendations.refetch();
          }}
        />
      </Screen>
    );
  }

  const items = attachments.data?.items ?? [];

  return (
    <Screen keyboardAvoiding scroll scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Typography variant="h2" weight="800">
            Фото и файлы
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
        <InfoRow label="Файлов" value={items.length} />
        <InfoRow label="Обновлено" value={formatDateTime(order.data.updatedAt)} />
      </View>

      {isAdding ? (
        <AddAttachmentPanel
          caption={caption}
          draft={draft}
          linkTargetId={linkTargetId}
          linkTargets={linkTargets}
          saving={createAttachment.isPending}
          visibility={visibility}
          onCancel={resetForm}
          onCaptionChange={setCaption}
          onLinkTargetChange={setLinkTargetId}
          onPickDocument={() => void handlePickDocument()}
          onPickPhoto={() => void handlePickPhoto()}
          onPickVideo={() => void handlePickVideo()}
          onSubmit={() => void handleSubmit()}
          onTakePhoto={() => void handleTakePhoto()}
          onVisibilityChange={setVisibility}
        />
      ) : (
        <Button onPress={() => setIsAdding(true)}>Добавить фото или файл</Button>
      )}

      <View style={styles.section}>
        <Typography variant="h4" weight="800">
          Список
        </Typography>
        {items.length === 0 ? (
          <StateBlock
            title="Файлов пока нет"
            description="Добавьте фото осмотра, видео или документ. Сейчас сохраняется только metadata."
          />
        ) : (
          items.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              deleting={deleteAttachment.isPending && deleteAttachment.variables === attachment.id}
              previewUri={localPreviews[attachment.id]}
              role={stoMe.data?.role}
              staffProfileId={stoMe.data?.staffProfile.id}
              onDelete={() => handleDelete(attachment.id)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

async function ensureMediaLibraryPermission() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.granted) return true;
  Alert.alert('Нет доступа к галерее', 'Разрешите доступ к фото и видео в настройках устройства.');
  return false;
}

async function ensureCameraPermission() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.granted) return true;
  Alert.alert('Нет доступа к камере', 'Разрешите доступ к камере в настройках устройства.');
  return false;
}

function imageAssetToDraft(asset: ImagePicker.ImagePickerAsset, type: AttachmentType): LocalAttachmentDraft {
  const fallback = type === 'VIDEO' ? 'video.mp4' : 'photo.jpg';
  return {
    type,
    uri: asset.uri,
    originalFilename: asset.fileName ?? filenameFromUri(asset.uri, fallback),
    mimeType: asset.mimeType ?? (type === 'VIDEO' ? 'video/mp4' : 'image/jpeg'),
    byteSize: asset.fileSize ?? null,
  };
}

function buildLinkTargets(input: {
  diagnostics: Array<{ id: string; createdAt: string }>;
  inspectionActId: string | null;
  recommendations: Array<{ id: string; text: string }>;
}): AttachmentLinkTarget[] {
  const targets: AttachmentLinkTarget[] = [{ id: orderOnlyTargetId, label: 'Только заказ' }];

  if (input.inspectionActId) {
    targets.push({
      id: `inspection:${input.inspectionActId}`,
      label: 'Акт осмотра',
      inspectionActId: input.inspectionActId,
    });
  }

  for (const diagnostic of input.diagnostics) {
    targets.push({
      id: `diagnostic:${diagnostic.id}`,
      label: diagnosticAttachmentLabel(diagnostic),
      diagnosticId: diagnostic.id,
    });
  }

  for (const recommendation of input.recommendations) {
    targets.push({
      id: `recommendation:${recommendation.id}`,
      label: recommendationAttachmentLabel(recommendation),
      recommendationId: recommendation.id,
    });
  }

  return targets;
}

function getAttachmentErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) return 'Нет доступа к файлам этого заказ-наряда.';
    if (error.status === 404) return 'Заказ-наряд или файл не найден.';
    if (error.status === 400) return 'Проверьте данные файла и выбранную связь.';
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
