# STO Mobile Part 1

This step turns the post-auth mobile app into an STO working shell connected to the real local backend API.

## Screens Added

- `/orders`: main post-auth screen with real work orders from `GET /api/sto/orders`.
- `/orders/new`: create work order screen.
- `/orders/[id]`: work order detail screen with status history and status change actions.
- `/profile`: staff profile/settings tab.
- `/orders/[id]/inspection`: working inspection act screen. See [STO Mobile Inspection](./STO_MOBILE_INSPECTION.md).
- `/orders/[id]/diagnostics`: working diagnostics screen. See [STO Mobile Diagnostics](./STO_MOBILE_DIAGNOSTICS.md).
- `/orders/[id]/recommendations`: placeholder.
- `/orders/[id]/attachments`: placeholder.
- `/orders/[id]/summary`: placeholder.

The component catalog remains in the codebase, but it is removed from the normal post-auth tab flow.

## Dev Users

Run the local seed and use one of:

- `mechanic@example.com` / `DevPassword123!`
- `master@example.com` / `DevPassword123!`
- `director@example.com` / `DevPassword123!`
- `admin@example.com` / `DevPassword123!`

`MASTER`, `DIRECTOR`, and `ADMIN` can create orders in the current UI. `MECHANIC` can view scoped orders and use status actions allowed by backend rules.

## Local Run

Start database and seed data:

```powershell
bun run --cwd backend seed:sto
```

Start backend:

```powershell
bun run --cwd backend dev
```

Start mobile:

```powershell
bun run --cwd mobile start
```

For Android emulator, `mobile/.env` should keep:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

## Mobile API Methods

The mobile `ApiClient` now uses the existing auth token flow and exposes:

- `getStoMe()`
- `listServiceCenters()`
- `listCustomers(query?)`
- `createCustomer(input)`
- `listVehicles(query?)`
- `createVehicle(input)`
- `listWorkOrders(query?)`
- `getWorkOrder(id)`
- `createWorkOrder(input)`
- `updateWorkOrder(id, input)`
- `changeWorkOrderStatus(id, input)`

All methods call `/api/sto/*`, use `EXPO_PUBLIC_API_URL`, send the existing bearer access token, and parse responses with contracts-based Zod schemas.

## Current STO Context

After login the app loads `GET /api/sto/me` through TanStack Query. The UI shows staff full name/email, role, organization, and service center. If backend returns `STO_STAFF_PROFILE_REQUIRED`, the app shows a seed/admin help message.

## Placeholders

The following are intentionally placeholders in this step:

- Recommendations UI.
- Photo/file upload UI.
- Summary UI.
- Admin staff management.
- Director reporting.

Those screens have routes/buttons so the order detail flow already has stable navigation targets.
