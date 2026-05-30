import { z } from 'zod'

import { diagnosticSideSchema, stoFieldTypeSchema } from './sto'

const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})

export const stoFormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: stoFieldTypeSchema,
  required: z.boolean().optional(),
  snapshot: z.boolean().optional(),
  options: z.array(fieldOptionSchema).optional(),
})

export const stoFormSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  fields: z.array(stoFormFieldSchema),
})

export const stoFormTemplateSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  title: z.string(),
  sections: z.array(stoFormSectionSchema),
})

export const diagnosticItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.string(),
  side: diagnosticSideSchema,
  hasPrice: z.boolean(),
})

export const diagnosticCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  items: z.array(diagnosticItemSchema),
})

export const diagnosticTemplateSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  title: z.string(),
  categories: z.array(diagnosticCategorySchema),
})

const yesNoOptions = [
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Нет' },
]

const sparePartsHandlingOptions = [
  { value: 'return', label: 'Возврат' },
  { value: 'dispose', label: 'Утилизация' },
]

const conditionOptions = [
  { value: 'ok', label: 'В норме' },
  { value: 'attention', label: 'Требует внимания' },
  { value: 'urgent', label: 'Срочно' },
]

export const inspectionActTemplateV1 = stoFormTemplateSchema.parse({
  id: 'inspection_act',
  version: 1,
  title: 'Акт осмотра',
  sections: [
    {
      id: 'general',
      label: 'Общие данные',
      fields: [
        { id: 'order_number', label: 'Номер заказ-наряда', type: 'text', snapshot: true },
        { id: 'customer_name', label: 'ФИО клиента', type: 'text', snapshot: true },
        { id: 'customer_phone', label: 'Телефон клиента', type: 'text', snapshot: true },
        { id: 'car_brand_model', label: 'Марка и модель', type: 'text', snapshot: true },
        { id: 'car_vin', label: 'VIN', type: 'text', snapshot: true },
        { id: 'car_plate', label: 'Гос. номер', type: 'text', snapshot: true },
        { id: 'engine_spec', label: 'Двигатель', type: 'text', snapshot: true },
        { id: 'car_year', label: 'Год выпуска', type: 'number', snapshot: true },
        { id: 'car_mileage', label: 'Пробег', type: 'number', snapshot: true },
        { id: 'visit_reason', label: 'Причина обращения', type: 'text_multiline', snapshot: true },
      ],
    },
    {
      id: 'wheel_locks_and_parts',
      label: 'Секретки и запасные части',
      fields: [
        {
          id: 'wheel_lock_present',
          label: 'Секретка для колес',
          type: 'choice',
          options: yesNoOptions,
        },
        { id: 'wheel_lock_location', label: 'Место хранения секретки', type: 'text' },
        {
          id: 'engine_immobilizer_present',
          label: 'Секретка на запуск двигателя',
          type: 'choice',
          options: yesNoOptions,
        },
        {
          id: 'spare_parts_handling',
          label: 'Замененные запасные части',
          type: 'choice',
          options: sparePartsHandlingOptions,
        },
      ],
    },
    {
      id: 'exterior_front_lights',
      label: 'Передняя светотехника',
      fields: [
        {
          id: 'front_turn_signals',
          label: 'Передние указатели поворота',
          type: 'condition3',
          options: conditionOptions,
        },
        {
          id: 'front_parking_drl',
          label: 'Габариты / ДХО',
          type: 'condition3',
          options: conditionOptions,
        },
        { id: 'low_beam', label: 'Ближний свет', type: 'condition3', options: conditionOptions },
        { id: 'high_beam', label: 'Дальний свет', type: 'condition3', options: conditionOptions },
        {
          id: 'front_fog_lights',
          label: 'Передние противотуманные фары',
          type: 'condition3',
          options: conditionOptions,
        },
      ],
    },
    {
      id: 'exterior_rear_lights',
      label: 'Задняя светотехника',
      fields: [
        {
          id: 'rear_turn_signals',
          label: 'Задние указатели поворота',
          type: 'condition3',
          options: conditionOptions,
        },
        {
          id: 'rear_parking_lights',
          label: 'Задние габариты',
          type: 'condition3',
          options: conditionOptions,
        },
        { id: 'brake_lights', label: 'Стоп-сигналы', type: 'condition3', options: conditionOptions },
        {
          id: 'rear_fog_lights',
          label: 'Задние противотуманные фонари',
          type: 'condition3',
          options: conditionOptions,
        },
        {
          id: 'rear_tail_reverse_lights',
          label: 'Задний ход / дополнительные задние фонари',
          type: 'condition3',
          options: conditionOptions,
        },
      ],
    },
    {
      id: 'wipers_and_washers',
      label: 'Щетки и омыватели',
      fields: [
        {
          id: 'front_wiper_blades',
          label: 'Передние щетки стеклоочистителя',
          type: 'condition3',
          options: conditionOptions,
        },
        {
          id: 'rear_wiper_blades',
          label: 'Задняя щетка стеклоочистителя',
          type: 'condition3',
          options: conditionOptions,
        },
        {
          id: 'windshield_washer',
          label: 'Омыватель лобового стекла',
          type: 'condition3',
          options: conditionOptions,
        },
        {
          id: 'headlight_washer',
          label: 'Омыватель фар',
          type: 'condition3',
          options: conditionOptions,
        },
        {
          id: 'rear_window_washer',
          label: 'Омыватель заднего стекла',
          type: 'condition3',
          options: conditionOptions,
        },
      ],
    },
    {
      id: 'under_hood',
      label: 'Подкапотное пространство',
      fields: [
        { id: 'engine_oil', label: 'Моторное масло', type: 'text' },
        { id: 'coolant', label: 'Охлаждающая жидкость', type: 'text' },
        { id: 'gearbox_oil', label: 'Масло КПП', type: 'text' },
        { id: 'drive_belts', label: 'Приводные ремни', type: 'text' },
        { id: 'engine_operation', label: 'Работа двигателя', type: 'text_multiline' },
        { id: 'power_steering_fluid', label: 'Жидкость ГУР', type: 'text' },
        { id: 'brake_fluid', label: 'Тормозная жидкость', type: 'text' },
        { id: 'battery_charge', label: 'Заряд АКБ', type: 'text' },
        { id: 'battery_replacement', label: 'Замена АКБ', type: 'text' },
        { id: 'battery_terminals', label: 'Клеммы АКБ', type: 'text' },
        { id: 'radiators_hoses', label: 'Радиаторы и патрубки', type: 'text_multiline' },
      ],
    },
    {
      id: 'summary',
      label: 'Итоговые рекомендации',
      fields: [
        {
          id: 'inspection_recommendations',
          label: 'Рекомендации по итогам осмотра',
          type: 'text_multiline',
        },
        { id: 'customer_source', label: 'Источник клиента', type: 'text' },
      ],
    },
  ],
})

const diagnosticItem = (
  category: string,
  id: string,
  label: string,
  side: 'none' | 'both',
  hasPrice: boolean,
) => ({ id, label, category, side, hasPrice })

export const diagnosticTemplateV1 = diagnosticTemplateSchema.parse({
  id: 'diagnostics',
  version: 1,
  title: 'Диагностика',
  categories: [
    {
      id: 'front_suspension',
      label: 'Ходовая часть спереди',
      items: [
        diagnosticItem('front_suspension', 'front_shock_absorber', 'Амортизатор передний', 'both', true),
        diagnosticItem('front_suspension', 'front_shock_mount', 'Опора переднего амортизатора', 'both', true),
        diagnosticItem(
          'front_suspension',
          'front_bumpstops_dust_covers',
          'Отбойники / пыльники спереди',
          'both',
          true,
        ),
        diagnosticItem('front_suspension', 'front_spring', 'Пружина передняя', 'both', true),
        diagnosticItem('front_suspension', 'front_upper_ball_joint', 'Верхняя шаровая опора спереди', 'both', true),
        diagnosticItem('front_suspension', 'front_lower_ball_joint', 'Нижняя шаровая опора спереди', 'both', true),
        diagnosticItem('front_suspension', 'front_hub_bearing', 'Передний ступичный подшипник', 'both', true),
        diagnosticItem(
          'front_suspension',
          'front_upper_arm_bushings',
          'Сайлентблоки верхнего переднего рычага',
          'both',
          true,
        ),
        diagnosticItem(
          'front_suspension',
          'front_lower_arm_bushings',
          'Сайлентблоки нижнего переднего рычага',
          'both',
          true,
        ),
        diagnosticItem('front_suspension', 'front_stabilizer_bar', 'Передний стабилизатор', 'none', true),
        diagnosticItem('front_suspension', 'front_stabilizer_bushings', 'Втулки переднего стабилизатора', 'both', true),
        diagnosticItem('front_suspension', 'front_stabilizer_links', 'Стойки переднего стабилизатора', 'both', true),
        diagnosticItem(
          'front_suspension',
          'front_stabilizer_link_bushings',
          'Втулки стоек переднего стабилизатора',
          'both',
          true,
        ),
        diagnosticItem('front_suspension', 'steering_rack', 'Рулевая рейка', 'none', true),
        diagnosticItem('front_suspension', 'steering_tie_rods', 'Рулевые тяги', 'both', true),
        diagnosticItem('front_suspension', 'steering_tie_rod_ends', 'Наконечники рулевых тяг', 'both', true),
        diagnosticItem('front_suspension', 'steering_column', 'Рулевая колонка', 'none', false),
        diagnosticItem('front_suspension', 'steering_shaft_cardan', 'Кардан рулевого вала', 'none', true),
        diagnosticItem('front_suspension', 'front_subframe_beams', 'Передний подрамник / балки', 'none', true),
      ],
    },
    {
      id: 'rear_suspension',
      label: 'Ходовая часть сзади',
      items: [
        diagnosticItem('rear_suspension', 'rear_shock_absorber', 'Амортизатор задний', 'both', true),
        diagnosticItem('rear_suspension', 'rear_shock_mount', 'Опора заднего амортизатора', 'both', true),
        diagnosticItem(
          'rear_suspension',
          'rear_bumpstops_dust_covers',
          'Отбойники / пыльники сзади',
          'both',
          true,
        ),
        diagnosticItem('rear_suspension', 'rear_spring', 'Пружина задняя', 'both', true),
        diagnosticItem('rear_suspension', 'rear_upper_ball_joint', 'Верхняя шаровая опора сзади', 'both', true),
        diagnosticItem('rear_suspension', 'rear_lower_ball_joint', 'Нижняя шаровая опора сзади', 'both', true),
        diagnosticItem('rear_suspension', 'rear_hub_bearing', 'Задний ступичный подшипник', 'both', true),
        diagnosticItem(
          'rear_suspension',
          'rear_upper_lateral_arm_bushings',
          'Сайлентблоки верхнего поперечного рычага',
          'both',
          true,
        ),
        diagnosticItem(
          'rear_suspension',
          'rear_lower_lateral_arm_bushings',
          'Сайлентблоки нижнего поперечного рычага',
          'both',
          true,
        ),
        diagnosticItem('rear_suspension', 'rear_beam_bushings', 'Сайлентблоки задней балки', 'both', true),
        diagnosticItem('rear_suspension', 'rear_stabilizer_bar', 'Задний стабилизатор', 'none', true),
        diagnosticItem('rear_suspension', 'rear_stabilizer_bushings', 'Втулки заднего стабилизатора', 'both', true),
        diagnosticItem('rear_suspension', 'rear_stabilizer_links', 'Стойки заднего стабилизатора', 'both', true),
        diagnosticItem(
          'rear_suspension',
          'rear_stabilizer_link_bushings',
          'Втулки стоек заднего стабилизатора',
          'both',
          true,
        ),
        diagnosticItem('rear_suspension', 'trailing_arm', 'Продольный рычаг', 'both', true),
        diagnosticItem('rear_suspension', 'trailing_arm_bushings', 'Сайлентблоки продольного рычага', 'both', true),
        diagnosticItem('rear_suspension', 'lateral_arm', 'Поперечный рычаг', 'both', true),
        diagnosticItem('rear_suspension', 'lateral_arm_bushings', 'Сайлентблоки поперечного рычага', 'both', true),
      ],
    },
    {
      id: 'brakes',
      label: 'Тормозная система',
      items: [
        diagnosticItem('brakes', 'front_brake_hose', 'Передний тормозной шланг', 'both', true),
        diagnosticItem('brakes', 'front_brake_disc', 'Передний тормозной диск', 'both', true),
        diagnosticItem('brakes', 'front_brake_pads', 'Передние тормозные колодки', 'both', true),
        diagnosticItem('brakes', 'front_brake_caliper', 'Передний тормозной суппорт', 'both', true),
        diagnosticItem('brakes', 'rear_brake_hose', 'Задний тормозной шланг', 'both', true),
        diagnosticItem('brakes', 'rear_brake_disc_or_drum', 'Задний тормозной диск / барабан', 'both', true),
        diagnosticItem('brakes', 'rear_brake_pads', 'Задние тормозные колодки', 'both', true),
        diagnosticItem('brakes', 'rear_brake_caliper', 'Задний тормозной суппорт', 'both', true),
      ],
    },
    {
      id: 'parking_brake',
      label: 'Стояночный тормоз',
      items: [
        diagnosticItem('parking_brake', 'parking_brake_cable', 'Трос стояночного тормоза', 'none', true),
        diagnosticItem('parking_brake', 'parking_brake_shoes', 'Колодки стояночного тормоза', 'none', true),
      ],
    },
    {
      id: 'transmission',
      label: 'Трансмиссия',
      items: [
        diagnosticItem('transmission', 'outer_cv_joint', 'Наружный ШРУС', 'both', true),
        diagnosticItem('transmission', 'inner_cv_joint', 'Внутренний ШРУС', 'both', true),
        diagnosticItem('transmission', 'outer_cv_boot', 'Пыльник наружного ШРУС', 'both', true),
        diagnosticItem('transmission', 'inner_cv_boot', 'Пыльник внутреннего ШРУС', 'both', true),
        diagnosticItem('transmission', 'drive_shaft_seal', 'Сальник привода', 'both', true),
      ],
    },
    {
      id: 'totals',
      label: 'Итоги',
      items: [
        diagnosticItem('totals', 'other_recommendations', 'Прочие рекомендации', 'none', false),
        diagnosticItem('totals', 'alignment_comment', 'Комментарий по сход-развалу', 'none', false),
        diagnosticItem('totals', 'parts_total', 'Итого запчасти', 'none', false),
        diagnosticItem('totals', 'service_total', 'Итого работы', 'none', false),
        diagnosticItem('totals', 'grand_total', 'Итого общая сумма', 'none', false),
        diagnosticItem('totals', 'executor_name', 'Исполнитель', 'none', false),
      ],
    },
  ],
})

export type StoFormField = z.infer<typeof stoFormFieldSchema>
export type StoFormSection = z.infer<typeof stoFormSectionSchema>
export type StoFormTemplate = z.infer<typeof stoFormTemplateSchema>
export type DiagnosticItem = z.infer<typeof diagnosticItemSchema>
export type DiagnosticCategory = z.infer<typeof diagnosticCategorySchema>
export type DiagnosticTemplate = z.infer<typeof diagnosticTemplateSchema>
