# Доменная модель СТО

Этот документ адаптирует старую модель Python/Telegram-бота под текущую архитектуру Android-приложения, backend API и PostgreSQL. В текущей Prisma-схеме уже есть auth/session/subscription/push модели шаблона. Сущности ниже - будущий STO-домен; миграции нужно добавлять отдельным этапом.

Новые сущности должны использовать UUIDv7 `String @db.Uuid`, как текущий шаблон. Почти все изменяемые записи должны иметь `createdAt`, `updatedAt`, а пользовательские действия - `createdByUserId` и, где нужно, `updatedByUserId`.

## Organization

Зачем нужна: владелец данных компании/сети СТО.

Основные поля: `id`, `name`, `slug`, `timezone`, `isActive`, `createdAt`, `updatedAt`.

Связи: много `ServiceCenter`, `StaffProfile`, `Customer`, `Vehicle`, `WorkOrder`.

Из bot-документации: не было; бот предполагал один контекст сервиса.

Добавлено для приложения: мультифилиальность, граница доступа, отчетность директора.

Потом: тариф/план, юридические реквизиты, логотип, настройки организации.

## ServiceCenter / Branch

Зачем нужна: конкретный филиал/точка СТО.

Основные поля: `id`, `organizationId`, `name`, `address`, `phone`, `isActive`, `createdAt`, `updatedAt`.

Связи: принадлежит `Organization`, имеет сотрудников и заказ-наряды.

Из bot-документации: не было.

Добавлено для приложения: фильтр заказов по филиалу, отчетность по точкам, доступ сотрудников.

Потом: график работы, посты/подъемники, нумерация заказов по филиалу.

## StaffProfile / User role extension

Зачем нужна: профиль сотрудника поверх существующего `User`.

Основные поля: `id`, `userId`, `organizationId`, `serviceCenterId`, `fullName`, `phone`, `role`, `isActive`, `createdAt`, `updatedAt`.

Роли: `mechanic`, `master`, `director`, `admin`.

Связи: связан с `User`, организацией, филиалом; выступает автором заказов, актов, диагностик, рекомендаций, вложений, audit log.

Из bot-документации: `telegram_id`, `email`, `phone`, `full_name`, `role`, роли `mechanic`, `master`, `admin`.

Добавлено для приложения: разделение auth user и рабочего профиля, филиал, `director`, деактивация.

Потом: несколько филиалов на сотрудника, приглашения, матрица прав, график.

## Customer

Зачем нужна: клиент, который привозит автомобиль.

Основные поля: `id`, `organizationId`, `name`, `phone`, `email`, `notes`, `createdAt`, `updatedAt`.

Связи: принадлежит организации, имеет автомобили и заказ-наряды.

Из bot-документации: `customer_name`, `customer_phone`, `customer_source`.

Добавлено для приложения: повторные визиты, поиск, история клиента.

Потом: согласия, предпочтения связи, юрлица, клиентский портал.

## Car / Vehicle

Зачем нужна: автомобиль клиента, переиспользуемый в заказах.

Основные поля: `id`, `organizationId`, `customerId`, `brand`, `model`, `brandModel`, `vin`, `plate`, `engineSpec`, `year`, `currentMileage`, `notes`, `createdAt`, `updatedAt`.

Связи: принадлежит организации и клиенту, имеет много `WorkOrder`.

Из bot-документации: `car_brand_model`, `car_vin`, `car_plate`, `engine_spec`, `car_year`, `car_mileage`, поиск по VIN/гос. номеру.

Добавлено для приложения: связь с клиентом, текущий пробег отдельно от пробега в заказе.

Потом: история обслуживания, поколение/кузов, код двигателя, напоминания.

## WorkOrder

Зачем нужна: центральная сущность процесса, к которой привязаны клиент, авто, акт, диагностика, рекомендации и файлы.

Основные поля: `id`, `organizationId`, `serviceCenterId`, `customerId`, `vehicleId`, `number`, `status`, `visitReason`, `mileage`, `responsibleUserId`, `createdByUserId`, `closedAt`, `createdAt`, `updatedAt`.

Статусы MVP: `open`, `in_progress`, `awaiting_approval`, `approved`, `completed`, `closed`, `cancelled`.

Связи: один клиент, один автомобиль, один филиал; один `InspectionAct`; много `Diagnostic`, `Recommendation`, `OrderAttachment`, `WorkOrderStatusHistory`, `AuditLog`.

Из bot-документации: `orders.number`, `orders.car_id`, `orders.status`, статусы `open`, `in_progress`, `closed`, `cancelled`.

Добавлено для приложения: клиент, филиал, ответственный, причина обращения, история статусов.

Потом: пост/подъемник, планирование, счет, подпись клиента.

## InspectionAct

Зачем нужна: структурированный акт визуального осмотра автомобиля.

Основные поля: `id`, `organizationId`, `workOrderId`, `dataJson`, `schemaVersion`, `completedAt`, `createdByUserId`, `updatedByUserId`, `createdAt`, `updatedAt`.

Связи: принадлежит `WorkOrder`, имеет вложения, может быть источником рекомендаций.

Из bot-документации: `inspection_acts.order_id`, `data_json`, `created_by`, `updated_by`, секции общих данных, секреток, светотехники, щеток/омывателей, подкапотного пространства, итоговых рекомендаций; статусы `ok`, `attention`, `urgent`.

Добавлено для приложения: `organizationId`, `schemaVersion`, completed state, вложения, audit.

Потом: связь с `FormTemplate`, подпись клиента, PDF snapshot.

## Diagnostic

Зачем нужна: диагностика ходовой, тормозов, стояночного тормоза, трансмиссии и итогов.

Основные поля: `id`, `organizationId`, `workOrderId`, `dataJson`, `schemaVersion`, `otherRecommendations`, `alignmentComment`, `partsTotal`, `serviceTotal`, `grandTotal`, `executorUserId`, `createdByUserId`, `updatedByUserId`, `createdAt`, `updatedAt`.

Связи: принадлежит `WorkOrder`, имеет рекомендации и вложения.

Из bot-документации: `diagnostics.order_id`, `data_json`, `other_recommendations`, `parts_total`, `service_total`, `grand_total`, категории диагностики, статусы `ok`, `not_ok`, `recommend_service`, правила `side` и `has_price`.

Добавлено для приложения: исполнитель как пользователь, версия схемы, организация, вложения.

Потом: разные типы диагностик, автогенерация рекомендаций, каталог работ.

## Recommendation

Зачем нужна: рекомендация по ремонту/обслуживанию с ценами и статусом согласования.

Основные поля: `id`, `organizationId`, `workOrderId`, `diagnosticId`, `inspectionActId`, `text`, `status`, `partsPrice`, `servicePrice`, `totalPrice`, `createdByUserId`, `updatedByUserId`, `createdAt`, `updatedAt`.

Статусы: `suggested`, `approved`, `declined`, `done`.

Связи: принадлежит `WorkOrder`, опционально связана с `Diagnostic` или `InspectionAct`, имеет вложения.

Из bot-документации: текст, `suggested`, `approved`, `done`, цены запчастей/работ, связь с диагностикой.

Добавлено для приложения: `declined`, связь с актом, итоговая цена.

Потом: подпись/согласование клиента, резерв запчастей.

## OrderAttachment

Зачем нужна: метаданные фото, документов, видео и других файлов.

Основные поля: `id`, `organizationId`, `workOrderId`, `inspectionActId`, `diagnosticId`, `recommendationId`, `type`, `storageKey`, `publicUrl`, `originalFilename`, `mimeType`, `byteSize`, `caption`, `visibility`, `createdByUserId`, `createdAt`, `deletedAt`.

Типы: `photo`, `document`, `video`.

Связи: принадлежит заказу, опционально акту/диагностике/рекомендации.

Из bot-документации: `attachments`, `storage_key`, `file_url`, `original_filename`, `mime_type`, `type`, `caption`, `created_by`.

Добавлено для приложения: размер, видимость, soft delete, совместимость с presigned upload.

Потом: thumbnails, оптимизация изображений, offline upload queue.

## WorkOrderStatusHistory

Зачем нужна: история смены статусов.

Основные поля: `id`, `organizationId`, `workOrderId`, `fromStatus`, `toStatus`, `comment`, `changedByUserId`, `createdAt`.

Связи: принадлежит `WorkOrder`, автор - пользователь/сотрудник.

Из bot-документации: отдельной таблицы не было, статус был полем заказа.

Добавлено для приложения: отчетность, контроль, будущие live updates.

Потом: SLA, причины статусов, уведомления.

## AuditLog

Зачем нужна: история важных действий.

Основные поля: `id`, `organizationId`, `userId`, `entityType`, `entityId`, `action`, `payloadJson`, `createdAt`.

Связи: принадлежит организации, опционально пользователю.

Из bot-документации: optional `audit_log` с действиями `order_created`, `inspection_updated`, `diagnostic_updated`, `recommendation_approved`, `attachment_uploaded`.

Добавлено для приложения: организация, единый формат действий.

Потом: admin UI, export, retention policy.

## FormTemplate как future/optional

Зачем нужна: хранить версии форм, если их нужно редактировать без деплоя.

Основные поля: `id`, `organizationId`, `code`, `name`, `version`, `schemaJson`, `isActive`, `createdAt`, `updatedAt`.

Коды: `inspection_act`, `diagnostics`.

Связи: принадлежит организации; будущие `InspectionAct` и `Diagnostic` могут хранить `schemaVersion` или `formTemplateId`.

Из bot-документации: `form_templates.code`, `name`, `version`, `schema_json`, `is_active`.

Добавлено для приложения: organization-specific templates и версионирование.

Потом: admin editor, preview, миграция старых ответов. В MVP конфиги форм лучше держать в shared code/contracts.
