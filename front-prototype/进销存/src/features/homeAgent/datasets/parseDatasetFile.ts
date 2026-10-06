import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { DatasetRef } from '../types'

function inferType(values: unknown[]): string {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '')
  if (nonNull.length === 0) return 'unknown'
  if (nonNull.every((v) => typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v)))) {
    return 'number'
  }
  if (nonNull.every((v) => typeof v === 'boolean' || v === 'true' || v === 'false')) return 'boolean'
  return 'string'
}

function rowsToDataset(name: string, rows: Record<string, unknown>[]): DatasetRef {
  const id = `ds-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const columns =
    rows.length > 0
      ? Object.keys(rows[0]).map((name) => ({
          name,
          inferredType: inferType(rows.map((r) => r[name])),
        }))
      : []
  return {
    id,
    name,
    columns,
    rowCount: rows.length,
    rows,
  }
}

function parseCsv(text: string, name: string): DatasetRef {
  const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true })
  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message ?? 'CSV 解析失败')
  }
  return rowsToDataset(name, result.data)
}

function parseJson(text: string, name: string): DatasetRef {
  const parsed = JSON.parse(text) as unknown
  let rows: Record<string, unknown>[] = []
  if (Array.isArray(parsed)) {
    rows = parsed.map((item) => (typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : { value: item }))
  } else if (typeof parsed === 'object' && parsed !== null) {
    rows = [parsed as Record<string, unknown>]
  } else {
    throw new Error('JSON 需为对象或对象数组')
  }
  return rowsToDataset(name, rows)
}

function parseExcel(buffer: ArrayBuffer, name: string): DatasetRef {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('Excel 无工作表')
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  return rowsToDataset(name, rows)
}

export async function parseDatasetFile(file: File): Promise<DatasetRef> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.csv')) {
    return parseCsv(await file.text(), file.name)
  }
  if (lower.endsWith('.json')) {
    return parseJson(await file.text(), file.name)
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return parseExcel(await file.arrayBuffer(), file.name)
  }
  throw new Error('仅支持 CSV、Excel、JSON')
}
