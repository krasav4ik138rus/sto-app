# Backlog реализации СТО

Каждый пункт достаточно мал, чтобы дать Codex отдельным промптом. Порядок важен: сначала модели и contracts, потом backend API, потом mobile UI.

## 1. Docs / adaptation

- Проверить новые `docs/STO_*.md` с владельцем продукта.
- Утвердить роли MVP.
- Утвердить статусы заказ-наряда.
- Решить: один филиал в MVP или сразу несколько.
- Решить local dev storage для фото до production Spaces.

## 2. Prisma domain models

- Добавить enums ролей, статусов заказов, статусов рекомендаций, типов вложений.
- Добавить `Organization`.
- Добавить `ServiceCenter`.
- Добавить `StaffProfile` к существующему `User`.
- Добавить `Customer`.
- Добавить `Vehicle`.
- Добавить `WorkOrder`.
- Добавить `WorkOrderStatusHistory`.
- Добавить `InspectionAct` с JSON payload.
- Добавить `Diagnostic` с JSON payload и totals.
- Добавить `Recommendation`.
- Добавить `OrderAttachment`.
- Добавить `AuditLog`.
- `FormTemplate` оставить на потом или добавить inactive/future.

## 3. Contracts

- Схемы ролей, организации, филиала.
- Схемы customer/vehicle.
- Схемы work-order list/detail/create/update.
- Схемы inspection payload.
- Схемы diagnostic payload.
- Схемы recommendations.
- Схемы attachment metadata/upload intent.
- Схема summary response.
- Contract tests для enums, money, JSON forms.

## 4. Backend API

- Auth guard: текущий user + staff profile.
- Role guards для mechanic/master/director/admin.
- Work orders: list/create/detail/update status.
- Customer/vehicle lookup/create.
- Inspection routes: `/api/orders/:id/inspection`.
- Diagnostic routes: `/api/orders/:id/diagnostics`, `/api/diagnostics/:id`.
- Recommendation routes.
- Attachment metadata + upload intent routes.
- Summary route.
- Audit logging.
- Integration test: order -> inspection -> diagnostic -> recommendation -> summary.

## 5. Seed / dev data

- Одна organization.
- Один branch.
- Пользователи mechanic/master/director/admin.
- Клиенты и авто.
- Заказы в разных статусах.
- Примеры inspection/diagnostic JSON.
- Рекомендации и attachment metadata.

## 6. Mobile navigation shell

- Заменить post-auth component catalog на STO shell.
- Добавить entry для заказов.
- Добавить profile/settings.
- Добавить role-aware видимость.
- Добавить loading/empty/error states.

## 7. Orders list/create/detail

- Карточки заказов.
- Поиск и фильтры.
- Создание заказа.
- Customer/vehicle inline create.
- Карточка заказа.
- Смена статуса по роли.

## 8. Inspection form renderer

- Shared config акта.
- Renderer для `text`, `text_multiline`, `number`, `choice`, `condition3`.
- Навигация по секциям.
- Progress.
- Save/load API.
- Валидация значений.
- Summary проблемных пунктов.

## 9. Diagnostic form renderer

- Shared config диагностики.
- Категории.
- Карточки для `side: none` и `side: both`.
- Status controls.
- Price fields по `has_price`.
- Расчет totals.
- Save/load API.

## 10. Recommendations

- Список рекомендаций.
- Создание/редактирование.
- Статусы.
- Prices/totals.
- Связь с диагностикой.
- Интеграция со сводкой.

## 11. Attachments/photos

- Решить MVP local storage/dev flow.
- Upload intent endpoint через existing storage service.
- Mobile camera/photo picker.
- Attachment metadata create/list/delete.
- Привязка к order/inspection/diagnostic/recommendation.
- Photo grid.

## 12. Summary/report screen

- Backend aggregation.
- Только проблемные пункты акта.
- Только `not_ok` и `recommend_service` из диагностики.
- Рекомендации с ценами.
- Totals.
- Mobile summary screen.

## 13. Roles/admin users

- Backend staff management endpoints.
- Role update rules.
- Admin/director users screen.
- Deactivate/reactivate.
- Audit log view.

## 14. Live status updates later

- Сначала обычный refetch/invalidation.
- WebSocket/SSE после стабилизации workflow.
- Redis-compatible Pub/Sub только при горизонтальном масштабировании backend.

## 15. Chat later

- Определить участников чата.
- Сохранение сообщений.
- Вложения после стабилизации order attachments.
- Push после настройки Expo/EAS push.

## 16. Webapp later

- Desktop reporting/admin в `webapp`.
- Android остается основным рабочим инструментом.
- Reuse backend API/contracts.

## 17. PDF export later

- Определить PDF-шаблон.
- Решить server-side или client-side генерацию.
- Добавить snapshot-поля, чтобы старые документы не менялись при изменении форм.
