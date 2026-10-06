import { providerPresets } from './providers'

export type ModelQuickOption = {
  key: string
  provider: string
  baseURL: string
  model: string
  label: string
}

export function buildModelQuickOptions(): ModelQuickOption[] {
  const options: ModelQuickOption[] = []
  for (const p of providerPresets) {
    if (p.id === 'custom') continue
    for (const model of p.models) {
      options.push({
        key: `${p.id}::${model}`,
        provider: p.id,
        baseURL: p.baseURL,
        model,
        label: `${p.label} · ${model}`,
      })
    }
  }
  return options
}

export function currentModelKey(provider: string, model: string): string {
  return `${provider}::${model}`
}
