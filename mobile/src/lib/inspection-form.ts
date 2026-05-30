import type { InspectionActData, WorkOrderDetailDto } from '@autoservice-app/contracts';
import type { StoFormField, StoFormTemplate } from '@autoservice-app/contracts';

export type InspectionFieldValue = InspectionActData['values'][string];

export type InspectionProgress = {
  filled: number;
  total: number;
  percent: number;
};

export function createEmptyInspectionData(
  template: StoFormTemplate,
  orderDetail?: WorkOrderDetailDto | null,
): InspectionActData {
  const data: InspectionActData = {
    schemaVersion: template.version,
    values: {},
  };

  if (!orderDetail) return data;

  const snapshotValues: Record<string, InspectionFieldValue> = {
    order_number: orderDetail.number,
    customer_name: orderDetail.customer?.name ?? null,
    customer_phone: orderDetail.customer?.phone ?? null,
    car_brand_model: orderDetail.vehicle.brandModel,
    car_vin: orderDetail.vehicle.vin ?? null,
    car_plate: orderDetail.vehicle.plate ?? null,
    engine_spec: orderDetail.vehicle.engineSpec ?? null,
    car_year: orderDetail.vehicle.year ?? null,
    car_mileage: orderDetail.mileage ?? orderDetail.vehicle.currentMileage ?? null,
    visit_reason: orderDetail.visitReason ?? null,
  };

  for (const section of template.sections) {
    for (const field of section.fields) {
      if (!field.snapshot) continue;
      const value = snapshotValues[field.id];
      if (value !== undefined) {
        data.values[field.id] = normalizeInspectionValue(field, value);
      }
    }
  }

  return data;
}

export function mergeInspectionWithSnapshot(
  template: StoFormTemplate,
  inspectionData: InspectionActData | null | undefined,
  orderDetail?: WorkOrderDetailDto | null,
): InspectionActData {
  const snapshot = createEmptyInspectionData(template, orderDetail);
  if (!inspectionData) return snapshot;

  return {
    schemaVersion: inspectionData.schemaVersion || template.version,
    values: {
      ...snapshot.values,
      ...inspectionData.values,
    },
  };
}

export function getInspectionFieldValue(
  data: InspectionActData,
  _sectionId: string,
  fieldId: string,
): InspectionFieldValue {
  return data.values[fieldId] ?? null;
}

export function setInspectionFieldValue(
  data: InspectionActData,
  _sectionId: string,
  fieldId: string,
  value: InspectionFieldValue,
): InspectionActData {
  return {
    ...data,
    values: {
      ...data.values,
      [fieldId]: value,
    },
  };
}

export function calculateInspectionProgress(
  template: StoFormTemplate,
  data: InspectionActData,
): InspectionProgress {
  const fields = template.sections.flatMap((section) => section.fields);
  const filled = fields.filter((field) => isFilledValue(getInspectionFieldValue(data, '', field.id))).length;
  const total = fields.length;

  return {
    filled,
    total,
    percent: total > 0 ? Math.round((filled / total) * 100) : 0,
  };
}

export function nextInspectionSectionId(template: StoFormTemplate, currentSectionId: string) {
  const currentIndex = template.sections.findIndex((section) => section.id === currentSectionId);
  return template.sections[Math.min(currentIndex + 1, template.sections.length - 1)]?.id ?? currentSectionId;
}

export function isLastInspectionSection(template: StoFormTemplate, currentSectionId: string) {
  return template.sections.at(-1)?.id === currentSectionId;
}

function normalizeInspectionValue(field: StoFormField, value: InspectionFieldValue): InspectionFieldValue {
  if (field.type === 'number') {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  return value;
}

function isFilledValue(value: InspectionFieldValue) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}
