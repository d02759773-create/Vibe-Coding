import { Drawer } from 'antd'
import type { HomeAgentConfigV1 } from '../types'
import { SettingsPanel } from './SettingsPanel'

type Props = {
  open: boolean
  onClose: () => void
  config: HomeAgentConfigV1
  onChange: (config: HomeAgentConfigV1) => void
}

export function AgentSettingsDrawer({ open, onClose, config, onChange }: Props) {
  return (
    <Drawer
      title="工作台设置"
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
      destroyOnClose={false}
    >
      <SettingsPanel config={config} onChange={onChange} />
    </Drawer>
  )
}
