# STO Mobile Diagnostics

Mobile Part 2B turns `/orders/[id]/diagnostics` from a placeholder into a working diagnostic screen backed by the STO diagnostics API.

## Screens And Components

- `mobile/src/app/orders/[id]/diagnostics.tsx` loads the work order, loads diagnostics, opens the newest diagnostic when one exists, and creates a local draft when none exists.
- `mobile/src/components/sto/forms/DiagnosticForm.tsx` renders the active category from `diagnosticTemplateV1`.
- `mobile/src/components/sto/forms/DiagnosticCategoryNav.tsx` renders the category selector.
- `mobile/src/components/sto/forms/DiagnosticItemField.tsx` renders one diagnostic item.
- `mobile/src/components/sto/forms/DiagnosticStatusField.tsx` renders `ok`, `not_ok`, and `recommend_service`.
- `mobile/src/components/sto/forms/MoneyField.tsx` renders parts/service price inputs.
- `mobile/src/components/sto/forms/DiagnosticTotalsCard.tsx` shows computed parts, service, and grand totals.
- `mobile/src/lib/diagnostic-form.ts` owns JSON draft helpers, side handling, progress, and totals calculation.

## Renderer

The renderer reads `diagnosticTemplateV1.categories` from `packages/contracts/src/stoForms.ts`.

Categories:

- `front_suspension`
- `rear_suspension`
- `brakes`
- `parking_brake`
- `transmission`
- `totals`

Each item uses:

- `side: none` for a single diagnostic value.
- `side: both` for separate left and right values.
- `hasPrice` to decide whether parts/service price fields can appear.

## JSON Draft Shape

Diagnostics use the contracts-compatible `DiagnosticData` shape:

```ts
{
  schemaVersion: 1,
  values: {
    front_shock_absorber: {
      left: {
        status: "not_ok",
        partsPrice: "10000",
        servicePrice: "3000",
        comment: "Replace"
      },
      right: {
        status: "ok",
        partsPrice: null,
        servicePrice: null,
        comment: null
      }
    },
    steering_rack: {
      status: "recommend_service",
      partsPrice: "0",
      servicePrice: "2500",
      comment: "Check on lift"
    }
  },
  totals: {
    otherRecommendations: null,
    alignmentComment: null,
    partsTotal: "10000.00",
    serviceTotal: "5500.00",
    grandTotal: "15500.00",
    executorName: "Demo Mechanic"
  }
}
```

## Side Rules

`side=none` stores one object with `status`, optional prices, and optional comment.

`side=both` stores two side objects:

- `left`
- `right`

Each side has its own status, prices, and comment.

## Prices And hasPrice

Price fields are shown only when:

- `item.hasPrice === true`
- status is `not_ok` or `recommend_service`

When status is `ok` or cleared, prices are cleared/ignored. Empty money input is stored as `null`; commas are normalized to dots.

## Totals

Mobile totals are recalculated immediately on status or price changes:

- `ok` and `null` statuses do not count prices.
- `not_ok` and `recommend_service` count prices when `hasPrice=true`.
- `side=both` counts left and right independently.
- empty prices count as zero.

On save, mobile sends:

- `dataJson`
- `otherRecommendations`
- `alignmentComment`
- `partsTotal`
- `serviceTotal`
- `grandTotal`

The backend also recalculates totals, and the screen refreshes from the saved response.

## Save And Load

The screen uses:

- `GET /api/sto/orders/:id`
- `GET /api/sto/orders/:id/diagnostics`
- `POST /api/sto/orders/:id/diagnostics`
- `PUT /api/sto/diagnostics/:diagnosticId`

If the order has diagnostics, the newest diagnostic by `createdAt` becomes active. If no diagnostic exists, the user starts a local draft and the first save creates the backend record. Later saves update that record.

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

Login with one of:

- `mechanic@example.com` / `DevPassword123!`
- `master@example.com` / `DevPassword123!`
- `director@example.com` / `DevPassword123!`
- `admin@example.com` / `DevPassword123!`

Open an order, tap diagnostics, create or edit a diagnostic, set statuses and prices, save, then reopen the screen.

## Not Implemented Yet

- Recommendations UI.
- Attachments/photo picker UI.
- Summary UI.
- Autosave/offline drafts.
- Detailed multi-diagnostic picker.
- Intercepting native Android back gesture with unsaved changes.
