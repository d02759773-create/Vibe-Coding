import { Modal, Typography } from 'antd'
import type { ConfirmActionPayload } from '../types'

type Props = {
  open: boolean
  payload: ConfirmActionPayload | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmActionModal({ open, payload, onConfirm, onCancel }: Props) {
  return (
    <Modal
      title={payload?.title ?? '确认操作'}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认执行"
      cancelText="取消"
      okButtonProps={{ danger: true }}
      destroyOnClose
    >
      <Typography.Paragraph style={{ marginBottom: 8 }}>{payload?.description}</Typography.Paragraph>
      {payload && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          动作：{payload.action} · {JSON.stringify(payload.params)}
        </Typography.Text>
      )}
    </Modal>
  )
}
