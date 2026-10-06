export type ProviderPreset = {
  id: string
  label: string
  baseURL: string
  models: string[]
}

export const providerPresets: ProviderPreset[] = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o'],
  },
  {
    id: 'qwen',
    label: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
  },
  {
    id: 'zhipu',
    label: '智谱',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-flash', 'glm-4-plus'],
  },
  {
    id: 'moonshot',
    label: 'Moonshot',
    baseURL: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k'],
  },
  {
    id: 'siliconflow',
    label: '硅基流动',
    baseURL: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-7B-Instruct'],
  },
  {
    id: 'custom',
    label: '自定义',
    baseURL: '',
    models: [],
  },
]

export function getProviderPreset(id: string): ProviderPreset {
  return providerPresets.find((p) => p.id === id) ?? providerPresets[0]
}
