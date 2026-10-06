import { defaultSystemPrompt } from '../config/defaultSystemPrompt'
import { getProviderPreset } from '../config/providers'
import type { HomeAgentConfigV1 } from '../types'

const STORAGE_KEY = 'inventory.homeAgent.config.v1'

const defaultProvider = getProviderPreset('deepseek')

export function defaultAgentConfig(): HomeAgentConfigV1 {
  return {
    configVersion: 1,
    provider: defaultProvider.id,
    baseURL: defaultProvider.baseURL,
    model: defaultProvider.models[0] ?? '',
    apiKeys: {},
    systemPrompt: defaultSystemPrompt,
    clarifyTimeoutMs: 600_000,
    ui: {},
  }
}

export function loadAgentConfig(): HomeAgentConfigV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAgentConfig()
    const parsed = JSON.parse(raw) as HomeAgentConfigV1
    if (parsed.configVersion !== 1) return defaultAgentConfig()
    return { ...defaultAgentConfig(), ...parsed, apiKeys: parsed.apiKeys ?? {} }
  } catch {
    return defaultAgentConfig()
  }
}

export function saveAgentConfig(config: HomeAgentConfigV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function getApiKey(config: HomeAgentConfigV1): string {
  return config.apiKeys[config.provider] ?? ''
}
