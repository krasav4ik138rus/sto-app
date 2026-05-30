import type { DiagnosticData, InspectionActData, MoneyInput, MoneyOutput } from '@autoservice-app/contracts'

export type DiagnosticTotals = {
  partsTotal: MoneyOutput
  serviceTotal: MoneyOutput
  grandTotal: MoneyOutput
}

export type InspectionProblemItem = {
  fieldKey: string
  value: 'attention' | 'urgent'
}

export type DiagnosticProblemItem = {
  diagnosticId: string
  fieldKey: string
  side: 'none' | 'left' | 'right'
  status: 'not_ok' | 'recommend_service'
  partsPrice: MoneyOutput
  servicePrice: MoneyOutput
  comment: string | null
}

type DiagnosticSideLike = {
  status?: unknown
  partsPrice?: unknown
  parts_price?: unknown
  servicePrice?: unknown
  service_price?: unknown
  comment?: unknown
}

export function calculateDiagnosticTotals(dataJson: DiagnosticData): DiagnosticTotals {
  let partsTotal = 0
  let serviceTotal = 0

  for (const item of Object.values(dataJson.values)) {
    for (const sideValue of diagnosticSideValues(item)) {
      if (!isProblemStatus(sideValue.status)) continue
      partsTotal += moneyToNumber(sideValue.partsPrice ?? sideValue.parts_price)
      serviceTotal += moneyToNumber(sideValue.servicePrice ?? sideValue.service_price)
    }
  }

  return moneyTotals(partsTotal, serviceTotal)
}

export function diagnosticTotalsFromInput(input: {
  dataJson: DiagnosticData
  partsTotal?: MoneyInput | null
  serviceTotal?: MoneyInput | null
  grandTotal?: MoneyInput | null
}): DiagnosticTotals {
  const calculated = calculateDiagnosticTotals(input.dataJson)
  const partsTotal = input.partsTotal === undefined ? calculated.partsTotal : moneyToOutput(input.partsTotal)
  const serviceTotal =
    input.serviceTotal === undefined ? calculated.serviceTotal : moneyToOutput(input.serviceTotal)
  const grandTotal =
    input.grandTotal === undefined
      ? moneyToOutput(moneyToNumber(partsTotal) + moneyToNumber(serviceTotal))
      : moneyToOutput(input.grandTotal)

  return {
    partsTotal,
    serviceTotal,
    grandTotal,
  }
}

export function extractInspectionProblemItems(dataJson: InspectionActData | null): InspectionProblemItem[] {
  if (!dataJson) return []

  return Object.entries(dataJson.values)
    .filter((entry): entry is [string, 'attention' | 'urgent'] => {
      return entry[1] === 'attention' || entry[1] === 'urgent'
    })
    .map(([fieldKey, value]) => ({ fieldKey, value }))
}

export function extractDiagnosticProblemItems(
  diagnosticId: string,
  dataJson: DiagnosticData,
): DiagnosticProblemItem[] {
  const items: DiagnosticProblemItem[] = []

  for (const [fieldKey, item] of Object.entries(dataJson.values)) {
    for (const sideValue of diagnosticSideValuesWithName(item)) {
      if (!isProblemStatus(sideValue.value.status)) continue
      items.push({
        diagnosticId,
        fieldKey,
        side: sideValue.side,
        status: sideValue.value.status,
        partsPrice: moneyToOutput(sideValue.value.partsPrice ?? sideValue.value.parts_price),
        servicePrice: moneyToOutput(sideValue.value.servicePrice ?? sideValue.value.service_price),
        comment: typeof sideValue.value.comment === 'string' ? sideValue.value.comment : null,
      })
    }
  }

  return items
}

export function recommendationTotal(input: {
  partsPrice?: unknown
  servicePrice?: unknown
  totalPrice?: unknown
}) {
  if (input.totalPrice !== undefined) return moneyToOutput(input.totalPrice)
  const partsPrice = moneyToNumber(input.partsPrice)
  const servicePrice = moneyToNumber(input.servicePrice)
  if (input.partsPrice === undefined && input.servicePrice === undefined) return null
  return moneyToOutput(partsPrice + servicePrice)
}

export function moneyToOutput(value: unknown): MoneyOutput {
  if (value === null || value === undefined || value === '') return null
  const numberValue = moneyToNumber(value)
  return numberValue.toFixed(2)
}

function moneyTotals(partsTotal: number, serviceTotal: number): DiagnosticTotals {
  return {
    partsTotal: moneyToOutput(partsTotal),
    serviceTotal: moneyToOutput(serviceTotal),
    grandTotal: moneyToOutput(partsTotal + serviceTotal),
  }
}

function diagnosticSideValues(item: unknown): DiagnosticSideLike[] {
  return diagnosticSideValuesWithName(item).map(({ value }) => value)
}

function diagnosticSideValuesWithName(item: unknown): Array<{
  side: 'none' | 'left' | 'right'
  value: DiagnosticSideLike
}> {
  if (!isRecord(item)) return []
  if (isRecord(item.left) || isRecord(item.right)) {
    return [
      ...(isRecord(item.left) ? [{ side: 'left' as const, value: item.left as DiagnosticSideLike }] : []),
      ...(isRecord(item.right) ? [{ side: 'right' as const, value: item.right as DiagnosticSideLike }] : []),
    ]
  }

  return [{ side: 'none', value: item as DiagnosticSideLike }]
}

function isProblemStatus(value: unknown): value is 'not_ok' | 'recommend_service' {
  return value === 'not_ok' || value === 'recommend_service'
}

function moneyToNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
    const parsed = Number(value.toString())
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
