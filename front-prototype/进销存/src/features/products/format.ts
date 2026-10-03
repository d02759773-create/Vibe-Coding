export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  return value
}
