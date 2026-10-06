import { Button, Popover, Select, message as antMessage } from 'antd'
import { FileOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useMemo, useRef, type ChangeEvent } from 'react'
import { buildModelQuickOptions, currentModelKey } from '../config/modelQuickOptions'
import { getProviderPreset } from '../config/providers'
import { parseDatasetFile } from '../datasets/parseDatasetFile'
import type { DatasetRef, HomeAgentConfigV1 } from '../types'

type Props = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  loading: boolean
  onDatasetAdd: (dataset: DatasetRef) => void
  config: HomeAgentConfigV1
  onConfigChange: (config: HomeAgentConfigV1) => void
}

export function AgentComposer({
  value,
  onChange,
  onSend,
  loading,
  onDatasetAdd,
  config,
  onConfigChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const modelOptions = useMemo(() => buildModelQuickOptions(), [])

  const pickFile = () => fileRef.current?.click()

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    void (async () => {
      for (const file of Array.from(files)) {
        try {
          const ds = await parseDatasetFile(file)
          onDatasetAdd(ds)
          antMessage.success(`已添加 ${file.name}`)
        } catch (err) {
          antMessage.error(err instanceof Error ? err.message : '解析失败')
        }
      }
    })()
    e.target.value = ''
  }

  const onModelQuickChange = (key: string) => {
    const opt = modelOptions.find((o) => o.key === key)
    if (!opt) return
    onConfigChange({
      ...config,
      provider: opt.provider,
      baseURL: opt.baseURL,
      model: opt.model,
    })
  }

  const modelSelectValue = modelOptions.some(
    (o) => o.key === currentModelKey(config.provider, config.model),
  )
    ? currentModelKey(config.provider, config.model)
    : undefined

  const customModelLabel = !modelSelectValue
    ? `${getProviderPreset(config.provider).label} · ${config.model || '未选模型'}`
    : undefined

  const attachMenu = (
    <div className="hermes-attach-menu">
      <button type="button" className="hermes-attach-item" onClick={pickFile}>
        <FileOutlined />
        <span>数据文件…</span>
        <span className="hermes-attach-hint">CSV / Excel / JSON</span>
      </button>
    </div>
  )

  return (
    <div className="hermes-composer">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        multiple
        hidden
        onChange={onFileChange}
      />
      <div className="hermes-composer-box">
        <Popover content={attachMenu} trigger="click" placement="topLeft" arrow={false}>
          <Button type="text" className="hermes-composer-plus" icon={<PlusOutlined />} />
        </Popover>
        <textarea
          className="hermes-composer-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder="给 AI 工作台一个任务…"
          rows={1}
        />
        <Select
          className="hermes-composer-model"
          popupMatchSelectWidth={280}
          value={modelSelectValue}
          placeholder={customModelLabel}
          options={modelOptions.map((o) => ({ value: o.key, label: o.label }))}
          onChange={onModelQuickChange}
          variant="borderless"
          size="small"
        />
        <Button
          type="primary"
          className="hermes-composer-send"
          icon={<ThunderboltOutlined />}
          loading={loading}
          onClick={onSend}
        />
      </div>
    </div>
  )
}
