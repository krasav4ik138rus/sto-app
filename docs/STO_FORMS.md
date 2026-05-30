# Формы СТО

Акт осмотра и диагностика должны быть конфигурационными формами. Mobile рендерит секции и поля из shared config, backend валидирует JSON payload и сохраняет ответы в JSONB (`InspectionAct.dataJson`, `Diagnostic.dataJson`).

## Inspection condition values

```ts
type InspectionCondition = 'ok' | 'attention' | 'urgent'
```

- `ok`: внешне/функционально в порядке.
- `attention`: рекомендуется принять меры.
- `urgent`: требуются срочные меры.

## Diagnostic status values

```ts
type DiagnosticStatus = 'ok' | 'not_ok' | 'recommend_service'
```

- `ok`: исправно.
- `not_ok`: неисправно.
- `recommend_service`: рекомендуется заменить или обслужить.

## Field types

- `text`: однострочный текст.
- `text_multiline`: многострочный комментарий.
- `number`: число, например год или пробег.
- `choice`: выбор одного значения из списка.
- `condition3`: трехстатусный осмотр `ok`, `attention`, `urgent`.
- `money`: денежное значение.

## Секции акта осмотра из source-документа

### Общие данные

- `order_number`: номер заказ-наряда, `text`.
- `customer_name`: ФИО клиента, `text`.
- `customer_phone`: телефон клиента, `text`.
- `car_brand_model`: марка/модель, `text`.
- `car_vin`: VIN, `text`.
- `car_plate`: гос. номер, `text`.
- `engine_spec`: объем/мощность двигателя, `text`.
- `car_year`: год выпуска, `number`.
- `car_mileage`: пробег, `number`.
- `visit_reason`: причина обращения/жалоба, `text_multiline`.

В приложении эти поля должны подтягиваться из `WorkOrder`, `Customer`, `Vehicle`, но JSON может хранить snapshot для истории.

### Секретки и запасные части

- `wheel_lock_present`: наличие секретки для колес, `choice`.
- `wheel_lock_location`: место хранения секретки, `text`.
- `engine_immobilizer_present`: секретка на запуск двигателя, `choice`.
- `spare_parts_handling`: замененные запчасти, `choice`.

### Внешний осмотр: передняя светотехника

Все поля `condition3`:

- `front_turn_signals`
- `front_parking_drl`
- `low_beam`
- `high_beam`
- `front_fog_lights`

### Внешний осмотр: задняя светотехника

Все поля `condition3`:

- `rear_turn_signals`
- `rear_parking_lights`
- `brake_lights`
- `rear_fog_lights`
- `rear_tail_reverse_lights`

### Щетки и омыватели

Все поля `condition3`:

- `front_wiper_blades`
- `rear_wiper_blades`
- `windshield_washer`
- `headlight_washer`
- `rear_window_washer`

### Подкапотное пространство

- `engine_oil`: `text`.
- `coolant`: `text`.
- `gearbox_oil`: `text`.
- `drive_belts`: `text`.
- `engine_operation`: `text_multiline`.
- `power_steering_fluid`: `text`.
- `brake_fluid`: `text`.
- `battery_charge`: `text`.
- `battery_replacement`: `text`.
- `battery_terminals`: `text`.
- `radiators_hoses`: `text_multiline`.

### Итоговые рекомендации

- `inspection_recommendations`: `text_multiline`.
- `customer_source`: `text`.

## Категории диагностики из source-документа

Каждый пункт диагностики описывается как `key`, `label`, `category`, `side`, `has_price`.

### Ходовая часть спереди

- `front_shock_absorber`: `both`, price.
- `front_shock_mount`: `both`, price.
- `front_bumpstops_dust_covers`: `both`, price.
- `front_spring`: `both`, price.
- `front_upper_ball_joint`: `both`, price.
- `front_lower_ball_joint`: `both`, price.
- `front_hub_bearing`: `both`, price.
- `front_upper_arm_bushings`: `both`, price.
- `front_lower_arm_bushings`: `both`, price.
- `front_stabilizer_bar`: `none`, price.
- `front_stabilizer_bushings`: `both`, price.
- `front_stabilizer_links`: `both`, price.
- `front_stabilizer_link_bushings`: `both`, price.
- `steering_rack`: `none`, price.
- `steering_tie_rods`: `both`, price.
- `steering_tie_rod_ends`: `both`, price.
- `steering_column`: `none`, no price.
- `steering_shaft_cardan`: `none`, price.
- `front_subframe_beams`: `none`, price.

### Ходовая часть сзади

- `rear_shock_absorber`: `both`, price.
- `rear_shock_mount`: `both`, price.
- `rear_bumpstops_dust_covers`: `both`, price.
- `rear_spring`: `both`, price.
- `rear_upper_ball_joint`: `both`, price.
- `rear_lower_ball_joint`: `both`, price.
- `rear_hub_bearing`: `both`, price.
- `rear_upper_lateral_arm_bushings`: `both`, price.
- `rear_lower_lateral_arm_bushings`: `both`, price.
- `rear_beam_bushings`: `both`, price.
- `rear_stabilizer_bar`: `none`, price.
- `rear_stabilizer_bushings`: `both`, price.
- `rear_stabilizer_links`: `both`, price.
- `rear_stabilizer_link_bushings`: `both`, price.
- `trailing_arm`: `both`, price.
- `trailing_arm_bushings`: `both`, price.
- `lateral_arm`: `both`, price.
- `lateral_arm_bushings`: `both`, price.

### Тормозная система

- `front_brake_hose`: `both`, price.
- `front_brake_disc`: `both`, price.
- `front_brake_pads`: `both`, price.
- `front_brake_caliper`: `both`, price.
- `rear_brake_hose`: `both`, price.
- `rear_brake_disc_or_drum`: `both`, price.
- `rear_brake_pads`: `both`, price.
- `rear_brake_caliper`: `both`, price.

### Стояночный тормоз

- `parking_brake_cable`: `none`, price.
- `parking_brake_shoes`: `none`, price.

### Трансмиссия

- `outer_cv_joint`: `both`, price.
- `inner_cv_joint`: `both`, price.
- `outer_cv_boot`: `both`, price.
- `inner_cv_boot`: `both`, price.
- `drive_shaft_seal`: `both`, price.

### Итоги

- `other_recommendations`: `text`.
- `alignment_comment`: `text`.
- `parts_total`: `money`.
- `service_total`: `money`.
- `grand_total`: `money`.
- `executor_name`: `text`, позже лучше заменить на `executorUserId`.

## Правила side

- `side: none`: одна оценка/статус для позиции.
- `side: both`: отдельные значения для левой и правой стороны.

Для `both` цены должны храниться отдельно по сторонам, потому что слева может быть `not_ok`, а справа `ok`.

## Правила has_price

- `has_price: true`: при `not_ok` или `recommend_service` показывать `parts_price` и `service_price`.
- `has_price: false`: сохранять только статус/комментарий.
- Если статус вернули в `ok`, mobile должен очистить или игнорировать цены.
- Backend должен пересчитывать totals или валидировать totals от клиента.

## Почему JSON, а не отдельные колонки

Формы содержат много полей, которые будут меняться. Если делать каждое поле отдельной колонкой, почти каждое изменение формы потребует Prisma migration.

JSONB подходит, потому что:

- акт и диагностика являются документами/snapshot;
- mobile должен рендерить форму по конфигурации;
- поля могут меняться без миграции;
- для отчетности важнее проблемные пункты, totals и статусы, а не каждая raw-колонка;
- стабильные бизнес-сущности остаются нормализованными: заказ, клиент, авто, рекомендации, файлы, статусы, аудит.

## Implementation Status

Shared contracts and form templates are implemented in `packages/contracts/src/sto.ts` and `packages/contracts/src/stoForms.ts`.

The first version includes `inspectionActTemplateV1` and `diagnosticTemplateV1`. Backend should validate incoming JSON payloads with the STO schemas before saving `InspectionAct.dataJson` and `Diagnostic.dataJson`; mobile should render the form UI from the shared templates.
