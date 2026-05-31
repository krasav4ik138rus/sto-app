# STO Mobile Summary

Mobile summary is implemented at:

```text
mobile/src/app/orders/[id]/summary.tsx
```

It is an internal-only working screen for STO staff and managers. It does not implement PDF, print, export, sharing, customer sending, or cloud storage.

## Components

Reusable components live outside Expo Router routes:

- `mobile/src/components/sto/summary/SummaryHeaderCard.tsx`
- `mobile/src/components/sto/summary/CustomerVehicleCard.tsx`
- `mobile/src/components/sto/summary/InspectionProblemsCard.tsx`
- `mobile/src/components/sto/summary/DiagnosticProblemsCard.tsx`
- `mobile/src/components/sto/summary/DiagnosticProblemAttachments.tsx`
- `mobile/src/components/sto/summary/RecommendationsSummaryCard.tsx`
- `mobile/src/components/sto/summary/AttachmentsSummaryCard.tsx`
- `mobile/src/components/sto/summary/TotalsCard.tsx`
- `mobile/src/components/sto/summary/SummaryActionsCard.tsx`
- `mobile/src/components/sto/summary/summary-utils.ts`

## Data

The screen uses existing mobile API/hooks:

- `GET /api/sto/orders/:id/summary`
- `GET /api/sto/orders/:id`
- `GET /api/sto/orders/:id/status-actions`
- `GET /api/sto/orders/:id/attachments`
- `useWorkOrderSummary(orderId)`
- `useAttachments(orderId)`
- `useWorkOrderStatusActions(orderId)`
- `stoQueryKeys.summary(orderId)`

Status actions are rendered by the shared `WorkOrderStatusActionBar` component. It is used by both order detail and summary, and status changes invalidate summary, order detail, orders list, and status actions.

## Blocks

The screen shows:

- order header, status, dates, service center, responsible staff, creator;
- customer and vehicle information;
- inspection problem items;
- diagnostic problem items;
- diagnostic photo evidence thumbnails when attachments are available;
- recommendations with statuses and money;
- attachments count and short list;
- totals for parts, labor, and grand total;
- quick actions to act, diagnostics, recommendations, photos/files, and order card.

## Inspection Problems

Inspection problems come from `summary.inspectionProblemItems`.

Labels are resolved from `inspectionActTemplateV1`. Empty state:

```text
Проблем по акту не отмечено.
```

## Diagnostic Problems

Diagnostic problems come from `summary.diagnosticProblemItems`.

Labels and categories are resolved from `diagnosticTemplateV1`. The screen shows:

- item label;
- category;
- side;
- status;
- parts price;
- service price;
- comment;
- photo count and thumbnails.

If the backend returns only `attachmentCount`, the screen still shows `Фото: N` and lets the user open the photos/files screen.

## Photo Evidence

The screen fetches the regular attachments list and matches diagnostic photos by:

- `diagnosticId`
- `contextType=DIAGNOSTIC_ITEM`
- `contextFieldId`
- `contextSide`

Thumbnails use the protected backend file endpoint through the existing mobile API helpers.

## Placeholders

These actions intentionally show a later placeholder:

- Export PDF
- Print
- Share

Not implemented yet:

- PDF export;
- print layout;
- share/send to customer;
- client approval link;
- cloud thumbnails;
- production cloud storage.

## Emulator Check

Use Android emulator with:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

Run:

```powershell
bun run --cwd backend seed:sto
bun run --cwd backend dev
bun run --cwd mobile start
```

Login with:

- `mechanic@example.com` / `DevPassword123!`
- `master@example.com` / `DevPassword123!`
- `director@example.com` / `DevPassword123!`
- `admin@example.com` / `DevPassword123!`

Open an order and tap `Сводка`.

## Status Permissions Note

MASTER can move a work order to `APPROVED` / `Согласован`. Backend remains the source of truth for status permissions.
