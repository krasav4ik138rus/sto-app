# STO Diagnostic Item Attachments

This step adds item-level attachment context for diagnostic photos.

## Context Fields

`OrderAttachment` now stores:

- `contextType`: `ORDER`, `INSPECTION_ACT`, `INSPECTION_FIELD`, `DIAGNOSTIC`, `DIAGNOSTIC_ITEM`, `RECOMMENDATION`.
- `contextSectionId`: template section/category id, for example `front_suspension`.
- `contextFieldId`: template field/item id, for example `front_shock_absorber`.
- `contextSide`: `NONE`, `LEFT`, `RIGHT`.
- `contextLabel`: human-readable label captured at upload time.

Old link fields stay in place:

- `inspectionActId`
- `diagnosticId`
- `recommendationId`

## Diagnostic Item Photos

For diagnostic problem statuses `not_ok` and `recommend_service`, the mobile diagnostic form shows `+ Фото`.

Upload sends:

- `type=PHOTO`
- `diagnosticId`
- `contextType=DIAGNOSTIC_ITEM`
- `contextSectionId`
- `contextFieldId`
- `contextSide`
- `contextLabel`
- `caption`

The backend validates that:

- `DIAGNOSTIC_ITEM` has `diagnosticId` and `contextFieldId`;
- `side=both` template items use `LEFT` or `RIGHT`;
- `side=none` template items use `NONE`;
- linked diagnostic/inspection/recommendation records belong to the same work order and organization.

## Side Rules

Diagnostic template `side=both` is stored as two independent contexts:

- `LEFT`
- `RIGHT`

Diagnostic template `side=none` is stored as:

- `NONE`

This lets reports show evidence beside the exact problem, not only beside the whole diagnostic.

## Mobile Display

The diagnostic form shows:

- `+ Фото` for problem item/side rows;
- `Фото: N`;
- compact photo thumbnails from the protected backend file endpoint.

The general attachments screen displays context labels like:

```text
Диагностика -> Амортизатор передний - левая сторона
```

## Storage

Files still use local backend storage:

```text
backend/.uploads/sto/...
```

Cloud storage remains a later step.

## Summary Screen

The mobile summary screen now uses `attachmentCount` and the attachments list to show photo evidence beside diagnostic problem items. Export/share remains a later step.
