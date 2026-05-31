import type { AttachmentVisibility } from '@autoservice-app/contracts';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  attachmentTypeLabels,
  attachmentVisibilityLabels,
  formatBytes,
  type AttachmentLinkTarget,
  type LocalAttachmentDraft,
} from '@/lib/attachments';

type AddAttachmentPanelProps = {
  caption: string;
  draft: LocalAttachmentDraft | null;
  linkTargetId: string;
  linkTargets: AttachmentLinkTarget[];
  saving?: boolean;
  visibility: AttachmentVisibility;
  onCancel: () => void;
  onCaptionChange: (value: string) => void;
  onLinkTargetChange: (value: string) => void;
  onPickDocument: () => void;
  onPickPhoto: () => void;
  onPickVideo: () => void;
  onSubmit: () => void;
  onTakePhoto: () => void;
  onVisibilityChange: (value: AttachmentVisibility) => void;
};

export function AddAttachmentPanel({
  caption,
  draft,
  linkTargetId,
  linkTargets,
  saving,
  visibility,
  onCancel,
  onCaptionChange,
  onLinkTargetChange,
  onPickDocument,
  onPickPhoto,
  onPickVideo,
  onSubmit,
  onTakePhoto,
  onVisibilityChange,
}: AddAttachmentPanelProps) {
  const colors = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.backgroundElement }]}>
      <View style={styles.header}>
        <Typography variant="h4" weight="800">
          Добавить файл
        </Typography>
        <Button size="sm" variant="ghost" onPress={onCancel}>
          Отмена
        </Button>
      </View>

      <View style={styles.actions}>
        <Button size="sm" variant="outline" onPress={onPickPhoto}>
          Фото из галереи
        </Button>
        <Button size="sm" variant="outline" onPress={onTakePhoto}>
          Камера
        </Button>
        <Button size="sm" variant="outline" onPress={onPickVideo}>
          Видео
        </Button>
        <Button size="sm" variant="outline" onPress={onPickDocument}>
          Документ
        </Button>
      </View>

      {draft ? (
        <View style={styles.draftRow}>
          <View style={styles.previewBox}>
            {draft.type === 'PHOTO' ? (
              <Image contentFit="cover" source={{ uri: draft.uri }} style={styles.previewImage} />
            ) : (
              <Typography align="center" variant="bodySm" weight="800">
                {attachmentTypeLabels[draft.type]}
              </Typography>
            )}
          </View>
          <View style={styles.draftText}>
            <Typography weight="800">{draft.originalFilename}</Typography>
            <Typography muted variant="bodySm">
              {draft.mimeType ?? 'MIME не определен'} · {formatBytes(draft.byteSize)}
            </Typography>
          </View>
        </View>
      ) : (
        <Typography muted>Выберите фото, видео или документ.</Typography>
      )}

      <View style={styles.field}>
        <Typography variant="label" weight="700">
          Подпись
        </Typography>
        <Textarea
          placeholder="Например: царапина на бампере, документ клиента"
          value={caption}
          onChangeText={onCaptionChange}
        />
      </View>

      <View style={styles.field}>
        <Typography variant="label" weight="700">
          Связь
        </Typography>
        <View style={styles.actions}>
          {linkTargets.map((target) => (
            <Button
              key={target.id}
              size="sm"
              variant={linkTargetId === target.id ? 'default' : 'outline'}
              onPress={() => onLinkTargetChange(target.id)}>
              {target.label}
            </Button>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Typography variant="label" weight="700">
          Видимость
        </Typography>
        <View style={styles.actions}>
          {visibilityOptions.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={visibility === option ? 'default' : 'outline'}
              onPress={() => onVisibilityChange(option)}>
              {attachmentVisibilityLabels[option]}
            </Button>
          ))}
        </View>
      </View>

      <Button disabled={!draft} loading={saving} onPress={onSubmit}>
        Загрузить файл
      </Button>
    </View>
  );
}

const visibilityOptions = ['INTERNAL', 'CUSTOMER_VISIBLE'] as const satisfies readonly AttachmentVisibility[];

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  draftRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  draftText: {
    flex: 1,
    gap: Spacing.one,
  },
  field: {
    gap: Spacing.two,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  previewBox: {
    alignItems: 'center',
    borderRadius: 8,
    height: 76,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 76,
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
});
