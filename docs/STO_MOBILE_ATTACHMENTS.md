# STO Mobile Attachments

Mobile Part 2D adds a real local backend upload flow for `/orders/[id]/attachments`.

The app now uploads file bytes to the backend with `multipart/form-data`. The backend stores files under
`backend/.uploads/sto/...` and keeps attachment metadata in `OrderAttachment`.

## What Was Added

- Attachments route: `mobile/src/app/orders/[id]/attachments.tsx`.
- Attachment UI components:
  - `AddAttachmentPanel`
  - `AttachmentCard`
- Shared mobile helpers in `mobile/src/lib/attachments.ts`.
- Mobile API methods:
  - `uploadAttachmentFile(orderId, input)`
  - `getAttachmentFileUrl(attachmentId)`
  - `getAttachmentFileHeaders()`
- TanStack Query hooks in `mobile/src/lib/sto.ts`:
  - `useAttachments(orderId)`
  - `useUploadAttachmentFile(orderId)`
  - `useDeleteAttachment(orderId)`
- Backend local file storage helpers in `backend/src/sto/attachment-files.ts`.
- Expo native modules:
  - `expo-image-picker`
  - `expo-document-picker`

## Backend Endpoints Used

- `GET /api/sto/orders/:id/attachments`
- `POST /api/sto/orders/:id/attachments/upload`
- `GET /api/sto/attachments/:attachmentId/file`
- `DELETE /api/sto/attachments/:attachmentId`
- `GET /api/sto/orders/:id/inspection`
- `GET /api/sto/orders/:id/diagnostics`
- `GET /api/sto/orders/:id/recommendations`
- `GET /api/sto/orders/:id`

The old metadata-only endpoint still exists:

- `POST /api/sto/orders/:id/attachments`

Use it only for dev/admin metadata checks. The mobile app uses the upload endpoint.

## Local Storage Behavior

Uploaded files are saved to:

```text
backend/.uploads/sto/<organizationId>/<workOrderId>/<uuid>-<safeFilename>
```

`backend/.uploads/` is gitignored and is intended only for local development.

The backend stores:

- `storageKey`
- `fileUrl`
- `originalFilename`
- `mimeType`
- `byteSize`
- `caption`
- `type`
- `visibility`
- optional link ids: `inspectionActId`, `diagnosticId`, `recommendationId`

`fileUrl` points to a protected backend endpoint:

```text
/api/sto/attachments/<attachmentId>/file
```

Files are not served from a public static directory.

## Access And Validation

Upload and download use the same STO auth/access checks as the rest of the work-order module.

The backend validates:

- file presence;
- max size: 25 MB;
- `PHOTO` must be an image MIME type;
- `VIDEO` must be a video MIME type;
- `DOCUMENT` must be a supported document MIME type;
- linked inspection/diagnostic/recommendation records must belong to the same work order.

Successful uploads write an `attachment_uploaded` audit log entry.

## Picker Flow

The screen supports:

- photo from gallery;
- photo from camera;
- video from gallery;
- document picker.

For gallery and camera the app requests device permissions. User cancellation is treated as a normal no-op. Permission denial shows a short alert.

## Preview Flow

The attachment card opens a preview modal.

- Photos render from the local preview URI immediately after upload, then from the protected backend file endpoint.
- Documents and videos show metadata now. A richer document/video viewer is deferred.
- Protected photo preview uses the mobile auth header returned by `getAttachmentFileHeaders()`.

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

The previous picker step added native Expo modules, so the Android development build must be rebuilt once after installing those modules:

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

This local upload change itself does not add new native modules.

## Still Deferred

- Cloud storage.
- Backend-generated thumbnails.
- Offline upload queue.
- Customer-visible sharing flow.
- Diagnostic item/side-level attachment schema.
- PDF/report export.
- Full document/video viewer.
