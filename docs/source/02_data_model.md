# Модель данных и ERD-план

## Подход к хранению

Система строится вокруг заказ-наряда. Часть данных хранится в нормализованных таблицах, а динамические формы акта осмотра и диагностики хранятся в JSON. Это позволяет менять состав полей формы без миграции под каждое новое поле.

Рекомендуемая БД: PostgreSQL.

## Основные таблицы

## users

Сотрудники приложения.

Поля:

- `id`: integer, primary key.
- `telegram_id`: bigint, optional, если остаётся интеграция с Telegram.
- `email`: string, optional, если будет веб-приложение.
- `phone`: string, optional.
- `full_name`: string, nullable.
- `role`: string, default `mechanic`.
- `created_at`: timestamptz.
- `updated_at`: timestamptz.

Роли:

- `mechanic`: механик.
- `master`: мастер/приёмщик.
- `admin`: администратор.

## cars

Автомобили клиентов.

Поля:

- `id`: integer, primary key.
- `brand_model`: string.
- `vin`: string, nullable.
- `plate`: string, nullable.
- `engine_spec`: string, nullable.
- `year`: integer, nullable.
- `mileage`: integer, nullable.
- `created_at`: timestamptz.
- `updated_at`: timestamptz.

Индексы:

- `vin`, если VIN используется как ключ поиска.
- `plate`, если часто ищем по гос. номеру.

## orders

Заказ-наряды.

Поля:

- `id`: integer, primary key.
- `number`: string, unique.
- `car_id`: foreign key to `cars.id`.
- `status`: string, default `open`.
- `created_at`: timestamptz.
- `updated_at`: timestamptz.

Статусы:

- `open`: открыт.
- `in_progress`: в работе.
- `closed`: закрыт.
- `cancelled`: отменён, опционально.

Связи:

- один заказ относится к одному автомобилю;
- один автомобиль может иметь много заказов;
- один заказ имеет один акт осмотра;
- один заказ может иметь одну или несколько диагностик;
- один заказ имеет много рекомендаций;
- один заказ имеет много вложений.

## inspection_acts

Акт визуального осмотра автомобиля.

Поля:

- `id`: integer, primary key.
- `order_id`: foreign key to `orders.id`, unique.
- `data_json`: jsonb.
- `created_by`: foreign key to `users.id`.
- `updated_by`: foreign key to `users.id`, nullable.
- `created_at`: timestamptz.
- `updated_at`: timestamptz.

Пример `data_json`:

```json
{
  "general": {
    "order_number": "12345",
    "customer_name": "Иванов Иван",
    "customer_phone": "+79990000000",
    "car_brand_model": "Toyota Camry",
    "car_mileage": 152000
  },
  "exterior_front": {
    "front_turn_signals": "ok",
    "low_beam": "urgent"
  },
  "under_hood": {
    "engine_oil": "уровень в норме, следов течи нет",
    "coolant": "ниже нормы, рекомендуем диагностику"
  },
  "summary": {
    "inspection_recommendations": "Заменить антифриз.",
    "customer_source": "Рекомендации знакомых"
  }
}
```

## diagnostics

Диагностика ходовой, тормозов и трансмиссии.

Поля:

- `id`: integer, primary key.
- `order_id`: foreign key to `orders.id`.
- `data_json`: jsonb.
- `other_recommendations`: text, nullable.
- `parts_total`: numeric(12,2), nullable.
- `service_total`: numeric(12,2), nullable.
- `grand_total`: numeric(12,2), nullable.
- `created_by`: foreign key to `users.id`.
- `updated_by`: foreign key to `users.id`, nullable.
- `created_at`: timestamptz.
- `updated_at`: timestamptz.

Пример `data_json`:

```json
{
  "front_suspension": {
    "front_shock_absorber": {
      "label": "Амортизатор (перед)",
      "left": {
        "status": "not_ok",
        "parts_price": 10000,
        "service_price": 3000
      },
      "right": {
        "status": "ok",
        "parts_price": null,
        "service_price": null
      }
    }
  },
  "brakes": {
    "front_brake_pads": {
      "label": "Тормозная система – перед – колодки",
      "left": {
        "status": "recommend_service",
        "parts_price": 5000,
        "service_price": 1500
      },
      "right": {
        "status": "recommend_service",
        "parts_price": 5000,
        "service_price": 1500
      }
    }
  },
  "meta": {
    "other_recommendations": "Проверить тормозную жидкость через 5000 км.",
    "alignment_comment": "Рекомендуется развал-схождение после ремонта подвески.",
    "parts_total": 20000,
    "service_total": 6000,
    "grand_total": 26000,
    "executor_name": "Петров Петр"
  }
}
```

## recommendations

Рекомендации по заказ-наряду.

Поля:

- `id`: integer, primary key.
- `order_id`: foreign key to `orders.id`.
- `diagnostic_id`: foreign key to `diagnostics.id`, nullable.
- `text`: text.
- `status`: string, default `suggested`.
- `price_parts`: numeric(12,2), nullable.
- `price_service`: numeric(12,2), nullable.
- `created_by`: foreign key to `users.id`.
- `updated_by`: foreign key to `users.id`, nullable.
- `created_at`: timestamptz.
- `updated_at`: timestamptz.

Статусы:

- `suggested`: предложено.
- `approved`: согласовано.
- `done`: выполнено.

## attachments

Файлы и медиа, прикреплённые к заказу.

Поля:

- `id`: integer, primary key.
- `order_id`: foreign key to `orders.id`.
- `inspection_act_id`: foreign key to `inspection_acts.id`, nullable.
- `diagnostic_id`: foreign key to `diagnostics.id`, nullable.
- `recommendation_id`: foreign key to `recommendations.id`, nullable.
- `storage_key`: string, путь или ключ файла в хранилище.
- `file_url`: string, nullable, если используется публичная или подписанная ссылка.
- `original_filename`: string, nullable.
- `mime_type`: string, nullable.
- `type`: string.
- `caption`: text, nullable.
- `created_by`: foreign key to `users.id`.
- `created_at`: timestamptz.

Типы:

- `photo`.
- `document`.
- `video`.

## form_templates

Опциональная таблица, если формы нужно редактировать без деплоя.

Поля:

- `id`: integer, primary key.
- `code`: string, unique.
- `name`: string.
- `version`: integer.
- `schema_json`: jsonb.
- `is_active`: boolean.
- `created_at`: timestamptz.
- `updated_at`: timestamptz.

Коды:

- `inspection_act`.
- `diagnostics`.

Если формы хранятся в коде приложения, эту таблицу можно не делать на первом этапе.

## audit_log

Опциональная таблица для истории действий.

Поля:

- `id`: integer, primary key.
- `user_id`: foreign key to `users.id`, nullable.
- `entity_type`: string.
- `entity_id`: integer.
- `action`: string.
- `payload_json`: jsonb, nullable.
- `created_at`: timestamptz.

Примеры действий:

- `order_created`.
- `inspection_updated`.
- `diagnostic_updated`.
- `recommendation_approved`.
- `attachment_uploaded`.

## Связи ERD

- `cars 1 -> N orders`.
- `orders 1 -> 1 inspection_acts`.
- `orders 1 -> N diagnostics`.
- `orders 1 -> N recommendations`.
- `orders 1 -> N attachments`.
- `diagnostics 1 -> N recommendations`.
- `inspection_acts 1 -> N attachments`.
- `diagnostics 1 -> N attachments`.
- `recommendations 1 -> N attachments`.
- `users 1 -> N inspection_acts created_by`.
- `users 1 -> N diagnostics created_by`.
- `users 1 -> N recommendations created_by`.
- `users 1 -> N attachments created_by`.

## Минимальный backend API

Заказы:

- `GET /orders`: список заказ-нарядов.
- `POST /orders`: создать заказ-наряд.
- `GET /orders/{id}`: карточка заказ-наряда.
- `PATCH /orders/{id}`: обновить статус или данные.

Автомобили:

- `GET /cars/{id}`: карточка автомобиля.
- `POST /cars`: создать автомобиль.
- `PATCH /cars/{id}`: обновить автомобиль.

Акт осмотра:

- `GET /orders/{id}/inspection`: получить акт.
- `PUT /orders/{id}/inspection`: сохранить акт целиком.
- `PATCH /orders/{id}/inspection`: частично обновить акт.

Диагностика:

- `GET /orders/{id}/diagnostics`: список диагностик.
- `POST /orders/{id}/diagnostics`: создать диагностику.
- `GET /diagnostics/{id}`: получить диагностику.
- `PUT /diagnostics/{id}`: сохранить диагностику целиком.

Рекомендации:

- `GET /orders/{id}/recommendations`: список рекомендаций.
- `POST /orders/{id}/recommendations`: добавить рекомендацию.
- `PATCH /recommendations/{id}`: обновить текст, статус или цены.

Файлы:

- `GET /orders/{id}/attachments`: список файлов.
- `POST /orders/{id}/attachments`: загрузить файл.
- `DELETE /attachments/{id}`: удалить файл.

Сводка:

- `GET /orders/{id}/summary`: получить итоговую сводку.

