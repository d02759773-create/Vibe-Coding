import { Form, Input, Modal } from 'antd'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export function DisableUserModal({ open, onCancel, onConfirm }: Props) {
  const [form] = Form.useForm<{ reason: string }>()

  const handleClose = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="停用用户"
      open={open}
      okText="确认停用"
      onCancel={handleClose}
      destroyOnClose
      onOk={async () => {
        try {
          const { reason } = await form.validateFields()
          onConfirm(String(reason).trim())
          form.resetFields()
        } catch {
          /* 字段标红，不关闭弹窗 */
        }
      }}
    >
      <p>停用后该账号无法登录。</p>
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label="停用原因"
          rules={[
            { required: true, whitespace: true, message: '请填写停用原因（1-200 字）' },
            { max: 200, message: '请填写停用原因（1-200 字）' },
          ]}
        >
          <Input.TextArea rows={3} maxLength={200} showCount placeholder="停用原因（必填，1-200 字）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
