# STO Mobile Recommendations

Mobile Part 2C replaces `/orders/[id]/recommendations` with a working recommendations screen for the Android STO flow.

## What Was Added

- Recommendations route: `mobile/src/app/orders/[id]/recommendations.tsx`.
- Recommendation UI components:
  - `RecommendationSummaryCard`
  - `RecommendationCard`
  - `RecommendationForm`
- Shared mobile helpers in `mobile/src/lib/recommendations.ts`.
- TanStack Query hooks in `mobile/src/lib/sto.ts`:
  - `useRecommendations(orderId)`
  - `useCreateRecommendation(orderId)`
  - `useUpdateRecommendation(orderId)`

## Backend Endpoints Used

- `GET /api/sto/orders/:id/recommendations`
- `POST /api/sto/orders/:id/recommendations`
- `PATCH /api/sto/recommendations/:recommendationId`
- `GET /api/sto/orders/:id/diagnostics` for optional diagnostic linking.
- `GET /api/sto/orders/:id` for order header and inspection-act link.

The screen does not add backend routes, Prisma schema changes, migrations, storage, or upload logic.

## List Screen

The route loads order detail, recommendations, diagnostics, and current STO staff profile. It shows loading, error, and empty states.

Each recommendation card shows:

- text;
- status;
- parts price;
- service price;
- total price;
- diagnostic link label when `diagnosticId` is present;
- inspection-act link state when `inspectionActId` is present;
- created and updated timestamps;
- edit and status actions allowed for the current role.

## Create And Edit

The inline form supports:

- required recommendation text;
- optional parts price;
- optional service price;
- total preview as parts plus service;
- optional diagnostic link;
- optional inspection-act link when the order already has an inspection act;
- status editing for manager roles during edit.

Money fields accept empty values as `null`, accept comma or dot during input, validate non-negative values, and send normalized decimal strings to the API. Backend remains the source of truth for the stored `totalPrice`.

## Status Workflow

Status labels:

- `SUGGESTED`: Предложено
- `APPROVED`: Согласовано
- `DECLINED`: Отклонено
- `DONE`: Выполнено

Manager roles can use quick status actions:

- `SUGGESTED -> APPROVED`
- `SUGGESTED -> DECLINED`
- `APPROVED -> DONE`
- `APPROVED -> DECLINED`

The UI does not offer rollback from `DONE`.

## Roles

- `MECHANIC` can create recommendations with status `SUGGESTED`.
- `MECHANIC` can edit only their own `SUGGESTED` recommendation when backend allows it.
- `MASTER`, `DIRECTOR`, and `ADMIN` can edit recommendations and change statuses.
- Backend remains the final authorization authority. If it returns `403`, the screen shows a role/access error.

## Local Emulator Check

Use the seeded dev users:

- `mechanic@example.com` / `DevPassword123!`
- `master@example.com` / `DevPassword123!`
- `director@example.com` / `DevPassword123!`
- `admin@example.com` / `DevPassword123!`

For Android emulator, keep:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

Run backend and mobile locally, then open an order and tap `Рекомендации`.

## Still Placeholder

- Photo/file upload UI.
- Summary/report screen UI.
- Customer approval link.
- PDF/export/share.
- Chat, push, and live status updates.
