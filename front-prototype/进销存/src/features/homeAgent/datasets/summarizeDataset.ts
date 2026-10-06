import type { DatasetRef } from '../types'

const SAMPLE_ROWS = 8

export function summarizeDataset(dataset: DatasetRef): string {
  const sample = dataset.rows.slice(0, SAMPLE_ROWS)
  return [
    `文件: ${dataset.name}`,
    `行数: ${dataset.rowCount}, 列: ${dataset.columns.map((c) => `${c.name}(${c.inferredType})`).join(', ')}`,
    `采样前 ${sample.length} 行 JSON:`,
    JSON.stringify(sample, null, 0),
  ].join('\n')
}

export function summarizeAllDatasets(datasets: DatasetRef[]): string {
  if (datasets.length === 0) return '（当前会话未上传数据文件）'
  return datasets.map((d) => summarizeDataset(d)).join('\n\n---\n\n')
}
