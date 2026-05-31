# STO Mobile Attachments

Mobile Part 2D replaces `/orders/[id]/attachments` with a working metadata-only photo and file screen.

## What Was Added

- Attachments route: `mobile/src/app/orders/[id]/attachments.tsx`.
- Attachment UI components:
  - `AddAttachmentPanel`
  - `AttachmentCard`
- Shared mobile helpers in `mobile/src/lib/attachments.ts`.
- TanStack Query hooks in `mobile/src/lib/sto.ts`:
  - `useAttachments(orderId)`
  - `useCreateAttachmentMetadata(orderId)`
  - `useDeleteAttachment(orderId)`
- Expo native modules:
  - `expo-image-picker`
  - `expo-document-picker`

## Backend Endpoints Used

- `GET /api/sto/orders/:id/attachments`
- `POST /api/sto/orders/:id/attachments`
- `DELETE /api/sto/attachments/:attachmentId`
- `GET /api/sto/orders/:id/inspection`
- `GET /api/sto/orders/:id/diagnostics`
- `GET /api/sto/orders/:id/recommendations`
- `GET /api/sto/orders/:id`

No Prisma schema, migration, production storage, or backend API change was added for this step.

## Metadata-Only Behavior

The picker selects a local file, but the app does not upload file bytes to backend or cloud storage yet. It sends only metadata:

- `type`
- `visibility`
- `storageKey`
- `originalFilename`
- `mimeType`
- `byteSize`
- `caption`
- optional link ids: `inspectionActId`, `diagnosticId`, `recommendationId`

`fileUrl` stays `null` because local device URIs are not public remote URLs.

## Storage Key

The app generates a local/dev key:

```text
dev/orders/<orderId>/<timestamp>-<safeFilename>
```

This key is stable enough for backend metadata and future upload migration. Real upload will later replace metadata-only behavior with cloud storage and public/private file URLs.

## Picker Flow

The screen supports:

- photo from gallery;
- photo from camera;
- video from gallery;
- document picker.

For gallery and camera the app requests device permissions. User cancellation is treated as a normal no-op. Permission denial shows a short alert.

## Link Target

Default link target is the whole order. If data exists, the user can link a file to:

- inspection act;
- a diagnostic;
- a recommendation.

The mobile app only sends ids. Backend remains responsible for scope validation.

## Delete

Delete calls the existing soft-delete endpoint. The UI shows delete for:

- the staff profile that created the attachment;
- `MASTER`, `DIRECTOR`, and `ADMIN`.

If backend returns `403`, the screen shows an access error.

## Local Emulator Check

For Android emulator, keep:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

Run backend and mobile, open an order, then tap `Фото/файлы`.

## Development Build Rebuild

This step adds native Expo modules, so the existing Android development build must be rebuilt once:

```powershell
cd C:\Users\alex\sto-app\mobile
bunx expo run:android --no-bundler
```

If `bunx` has the local Bun bin remap issue, use the local Expo CLI with Bun in PATH:

```powershell
cd C:\Users\alex\sto-app\mobile
$env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
bun ..\node_modules\expo\bin\cli run:android --no-bundler
```

## Still Deferred

- Real upload.
- Cloud storage.
- Thumbnails generated on backend.
- Offline upload queue.
- Customer-visible sharing.
- PDF/report export.
