import type { DiagnosticData, OrderAttachmentDto } from '@autoservice-app/contracts';
import type { DiagnosticItem } from '@autoservice-app/contracts';
import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import {
  getDiagnosticSideValue,
  setDiagnosticSideComment,
  setDiagnosticSidePrices,
  setDiagnosticSideStatus,
  sidesForItem,
  type DiagnosticSideName,
} from '@/lib/diagnostic-form';
import { getDiagnosticItemAttachments } from '@/lib/attachments';
import { DiagnosticItemPhotoButton } from './DiagnosticItemPhotoButton';
import { DiagnosticStatusField } from './DiagnosticStatusField';
import { MoneyField } from './MoneyField';

type DiagnosticItemFieldProps = {
  attachments?: OrderAttachmentDto[];
  data: DiagnosticData;
  diagnosticId?: string | null;
  fileHeaders?: Record<string, string>;
  getAttachmentFileUrl?: (attachmentId: string) => string;
  item: DiagnosticItem;
  onAddPhoto?: (side: DiagnosticSideName) => void;
  onChange: (data: DiagnosticData) => void;
};

export function DiagnosticItemField({
  attachments = [],
  data,
  diagnosticId,
  fileHeaders = {},
  getAttachmentFileUrl,
  item,
  onAddPhoto,
  onChange,
}: DiagnosticItemFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Typography variant="h4" weight="800">
        {item.label}
      </Typography>
      <View style={styles.sides}>
        {sidesForItem(item).map((side) => (
          <DiagnosticSideBlock
            key={side}
            data={data}
            diagnosticId={diagnosticId}
            attachments={attachments}
            fileHeaders={fileHeaders}
            getAttachmentFileUrl={getAttachmentFileUrl}
            item={item}
            side={side}
            onAddPhoto={() => onAddPhoto?.(side)}
            onChange={onChange}
          />
        ))}
      </View>
    </View>
  );
}

function DiagnosticSideBlock({
  data,
  diagnosticId,
  attachments,
  fileHeaders,
  getAttachmentFileUrl,
  item,
  side,
  onAddPhoto,
  onChange,
}: {
  data: DiagnosticData;
  diagnosticId?: string | null;
  attachments: OrderAttachmentDto[];
  fileHeaders: Record<string, string>;
  getAttachmentFileUrl?: (attachmentId: string) => string;
  item: DiagnosticItem;
  side: DiagnosticSideName;
  onAddPhoto?: () => void;
  onChange: (data: DiagnosticData) => void;
}) {
  const value = getDiagnosticSideValue(data, item, side);
  const showPrices = item.hasPrice && value.status !== null && value.status !== 'ok';
  const sideAttachments = getDiagnosticItemAttachments(attachments, diagnosticId, item.id, side);
  const showAddPhoto = value.status === 'not_ok' || value.status === 'recommend_service';

  return (
    <View style={styles.sideBlock}>
      {item.side === 'both' ? (
        <Typography variant="label" weight="700">
          {side === 'left' ? 'Левая сторона' : 'Правая сторона'}
        </Typography>
      ) : null}
      <DiagnosticStatusField
        value={value.status}
        onChange={(status) => onChange(setDiagnosticSideStatus(data, item.id, side, status))}
      />
      <DiagnosticItemPhotoButton
        attachments={sideAttachments}
        fileHeaders={fileHeaders}
        getFileUrl={getAttachmentFileUrl ?? (() => '')}
        showAddButton={showAddPhoto}
        onAddPhoto={() => onAddPhoto?.()}
      />
      {showPrices ? (
        <View style={styles.priceRow}>
          <MoneyField
            label="Запчасти"
            value={value.partsPrice}
            onChange={(partsPrice) =>
              onChange(setDiagnosticSidePrices(data, item.id, side, partsPrice, value.servicePrice ?? null))
            }
          />
          <MoneyField
            label="Работы"
            value={value.servicePrice}
            onChange={(servicePrice) =>
              onChange(setDiagnosticSidePrices(data, item.id, side, value.partsPrice ?? null, servicePrice))
            }
          />
        </View>
      ) : null}
      <View style={styles.comment}>
        <Typography variant="label" weight="700">
          Комментарий
        </Typography>
        <Input
          multiline
          textAlignVertical="top"
          value={value.comment ?? ''}
          onChangeText={(next) =>
            onChange(setDiagnosticSideComment(data, item.id, side, next.trim() ? next : null))
          }
          style={styles.commentInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: {
    gap: Spacing.two,
  },
  commentInput: {
    minHeight: 76,
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sideBlock: {
    gap: Spacing.two,
  },
  sides: {
    gap: Spacing.three,
  },
  wrapper: {
    gap: Spacing.three,
  },
});
