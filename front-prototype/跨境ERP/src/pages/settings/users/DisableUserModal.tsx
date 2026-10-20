import { Form, Input, Modal } from '@arco-design/web-react'

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
      visible={open}
      okText="确认停用"
      onCancel={handleClose}
      unmountOnExit
      onOk={async () => {
        try {
          await form.validate()
          const reason = String(form.getFieldValue('reason') ?? '').trim()
          onConfirm(reason)
          form.resetFields()
        } catch {
          /* 字段标红，不关闭弹窗 */
        }
      }}
    >
      <p>停用后该账号无法登录。</p>
      <Form form={form} layout="vertical">
        <Form.Item
          field="reason"
          label="停用原因"
          rules={[
            { required: true, message: '请填写停用原因（1-200 字）' },
            {
              validator: (value, callback) => {
                const text = String(value ?? '').trim()
                if (!text) {
                  callback('请填写停用原因（1-200 字）')
                  return
                }
                if (text.length > 200) {
                  callback('请填写停用原因（1-200 字）')
                  return
                }
                callback()
              },
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={200}
            showWordLimit
            placeholder="停用原因（必填，1-200 字）"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
