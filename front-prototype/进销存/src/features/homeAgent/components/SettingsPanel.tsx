import { Button, Form, Input, Select, Space, Typography } from 'antd'
import { useEffect } from 'react'
import { getProviderPreset, providerPresets } from '../config/providers'
import { defaultSystemPrompt } from '../config/defaultSystemPrompt'
import { getApiKey, saveAgentConfig } from '../storage/agentConfigStorage'
import type { HomeAgentConfigV1 } from '../types'
import { testConnection } from '../llm/openaiCompatClient'

type Props = {
  config: HomeAgentConfigV1
  onChange: (config: HomeAgentConfigV1) => void
}

export function SettingsPanel({ config, onChange }: Props) {
  const preset = getProviderPreset(config.provider)

  useEffect(() => {
    saveAgentConfig(config)
  }, [config])

  const patch = (partial: Partial<HomeAgentConfigV1>) => {
    onChange({ ...config, ...partial })
  }

  const onProviderChange = (providerId: string) => {
    const p = getProviderPreset(providerId)
    patch({
      provider: providerId,
      baseURL: p.baseURL,
      model: p.models[0] ?? config.model,
    })
  }

  const setApiKey = (key: string) => {
    patch({ apiKeys: { ...config.apiKeys, [config.provider]: key } })
  }

  const handleTest = async () => {
    const key = getApiKey(config)
    if (!key) {
      window.alert('请先填写 API Key')
      return
    }
    try {
      await testConnection({ baseURL: config.baseURL, apiKey: key, model: config.model })
      window.alert('连接成功')
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '连接失败')
    }
  }

  return (
    <div className="codex-settings">
      <p className="codex-section-label">Model</p>
      <Form layout="vertical" size="small">
        <Form.Item label="厂商">
          <Select
            value={config.provider}
            onChange={onProviderChange}
            options={providerPresets.map((p) => ({ value: p.id, label: p.label }))}
          />
        </Form.Item>
        <Form.Item label="Base URL">
          <Input
            value={config.baseURL}
            onChange={(e) => patch({ baseURL: e.target.value })}
            placeholder="OpenAI 兼容 API 地址"
          />
        </Form.Item>
        <Form.Item label="模型">
          {preset.models.length > 0 ? (
            <Select
              value={config.model}
              onChange={(m) => patch({ model: m })}
              options={preset.models.map((m) => ({ value: m, label: m }))}
              showSearch
              optionFilterProp="label"
            />
          ) : (
            <Input value={config.model} onChange={(e) => patch({ model: e.target.value })} />
          )}
        </Form.Item>
        <Form.Item label="API Key">
          <Input.Password
            value={getApiKey(config)}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="仅存于本机 localStorage"
          />
        </Form.Item>
        <Space>
          <Button size="small" onClick={handleTest}>测试连接</Button>
        </Space>
      </Form>

      <p className="codex-section-label" style={{ marginTop: 20 }}>Instructions</p>
      <Input.TextArea
        rows={14}
        value={config.systemPrompt}
        onChange={(e) => patch({ systemPrompt: e.target.value })}
      />
      <Button
        type="link"
        size="small"
        onClick={() => patch({ systemPrompt: defaultSystemPrompt })}
        style={{ padding: 0, marginTop: 4, fontSize: 12 }}
      >
        恢复默认模板
      </Button>
      <Typography.Paragraph style={{ fontSize: 11, marginTop: 16, color: '#5d5d6c' }}>
        配置仅保存在本机浏览器，不会上传到服务器。
      </Typography.Paragraph>
    </div>
  )
}
