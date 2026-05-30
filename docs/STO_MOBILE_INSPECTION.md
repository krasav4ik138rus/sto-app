# STO Mobile Inspection

Mobile Part 2A turns `/orders/[id]/inspection` from a placeholder into a working Android-first inspection act screen.

## Screens And Components

- `mobile/src/app/orders/[id]/inspection.tsx` loads the order, loads the inspection act, builds a local draft and saves it through the backend.
- `mobile/src/components/sto/forms/InspectionForm.tsx` renders the active section from `inspectionActTemplateV1`.
- `mobile/src/components/sto/forms/FormSectionNav.tsx` renders the horizontal section selector.
- `mobile/src/components/sto/forms/TextField.tsx`, `MultilineField.tsx`, `NumberField.tsx`, `ChoiceField.tsx`, and `Condition3Field.tsx` render supported field types.
- `mobile/src/components/sto/forms/SaveBar.tsx` shows progress, dirty state, save, save-and-exit and next-section actions.
- `mobile/src/lib/inspection-form.ts` owns draft helpers and progress calculation.

## Form Renderer

The renderer reads `inspectionActTemplateV1.sections` from `packages/contracts/src/stoForms.ts`. Each section contains fields with `id`, `label`, `type`, optional `snapshot`, and optional `options`.

Supported field types in this step:

- `text`
- `text_multiline`
- `number`
- `choice`
- `condition3`

`condition3` uses the stored values `ok`, `attention`, and `urgent` with mobile labels `В порядке`, `Внимание`, and `Срочно`.

## JSON Draft Shape

The screen stores the draft as `InspectionActData`:

```ts
{
  schemaVersion: 1,
  values: {
    order_number: "WO-0002",
    low_beam: "urgent",
    car_mileage: 211000
  }
}
```

The backend stores the same object in `InspectionAct.dataJson`. Field values are keyed by template field id.

Helpers:

- `createEmptyInspectionData(template, orderDetail?)`
- `mergeInspectionWithSnapshot(template, inspectionData, orderDetail?)`
- `getInspectionFieldValue(data, sectionId, fieldId)`
- `setInspectionFieldValue(data, sectionId, fieldId, value)`
- `calculateInspectionProgress(template, data)`

## General Snapshot Prefill

When no inspection act exists yet, general fields are prefilled from the work order detail:

- `order_number` from `workOrder.number`
- `customer_name` from `customer.name`
- `customer_phone` from `customer.phone`
- `car_brand_model` from `vehicle.brandModel`
- `car_vin` from `vehicle.vin`
- `car_plate` from `vehicle.plate`
- `engine_spec` from `vehicle.engineSpec`
- `car_year` from `vehicle.year`
- `car_mileage` from `workOrder.mileage` or `vehicle.currentMileage`
- `visit_reason` from `workOrder.visitReason`

If the inspection already exists, stored values win over the snapshot.

## API Endpoints Used

The inspection screen uses:

- `GET /api/sto/orders/:id`
- `GET /api/sto/orders/:id/inspection`
- `PUT /api/sto/orders/:id/inspection`

The mobile API client also now exposes Part 2 methods for diagnostics, recommendations, attachment metadata, and summary so the next mobile steps can build on the same client.

## Emulator Check

Use Android emulator with:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

Start local backend and mobile:

```powershell
bun run --cwd backend seed:sto
bun run --cwd backend dev
bun run --cwd mobile start
```

Login with one of the dev users:

- `mechanic@example.com` / `DevPassword123!`
- `master@example.com` / `DevPassword123!`
- `director@example.com` / `DevPassword123!`
- `admin@example.com` / `DevPassword123!`

Open an order, tap the inspection action, edit fields, save, then reopen the screen to verify values load from backend.

## Not Implemented Yet

- Diagnostics UI.
- Recommendations UI.
- Attachments/photo picker UI.
- Summary UI.
- Autosave/offline drafts.
- Intercepting the native Android back gesture with unsaved changes.
