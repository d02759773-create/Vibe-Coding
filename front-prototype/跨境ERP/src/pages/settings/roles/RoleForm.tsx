import { Button, Card, Form, Input, Message, Space } from '@arco-design/web-react'
import type { FormInstance } from '@arco-design/web-react'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { isValidRoleCode } from '@/features/settings/constants'
import { createRole, getRole, listRoles, nowString, saveRoles } from '@/features/settings/storage'
import { confirmUnsavedNavigate } from '@/pages/settings/confirmUnsavedLeave'
import { toastFormValidateFailed, toastSaveSuccess } from '@/pages/settings/formFeedback'
import { useUnsavedLeaveBlocker } from '@/pages/settings/useUnsavedLeaveBlocker'

export function RoleForm() {
  const formRef = useRef<FormInstance>(null)
  const [saving, setSaving] = useState(false)
  const [formEdited, setFormEdited] = useState(false)
  const { roleCode } = useParams()
  const navigate = useNavigate()
  const isNew = !roleCode || roleCode === 'new'
  const role = !isNew && roleCode ? getRole(roleCode) : undefined

  const leaveTarget =
    isNew || !roleCode ? '/settings/roles' : `/settings/roles/${roleCode}`
  const { allowLeaveOnce } = useUnsavedLeaveBlocker(formEdited && (isNew || !!role))
  const goBack = () =>
    confirmUnsavedNavigate(formEdited, () => {
      allowLeaveOnce()
      navigate(leaveTarget)
    })

  if (!isNew && !role) {
    return (
      <PageShell title="角色不存在">
        <Button onClick={() => navigate('/settings/roles')}>返回列表</Button>
      </PageShell>
    )
  }

  const initialValues = isNew
    ? { 角色编码: '', 角色名称: '', 角色说明: '' }
    : {
        角色编码: role!.角色编码,
        角色名称: role!.角色名称,
        角色说明: role!.角色说明,
      }

  const handleSubmit = async () => {
    const form = formRef.current
    if (!form) return
    try {
      await form.validate()
    } catch {
      toastFormValidateFailed()
      return
    }
    const values = form.getFieldsValue()
    setSaving(true)
    try {
      const name = String(values.角色名称 ?? '').trim()
      const desc = String(values.角色说明 ?? '').trim()
      const t = nowString()

      if (isNew) {
        const code = String(values.角色编码 ?? '').trim()
        if (listRoles().some((r) => r.角色编码 === code)) {
          form.setFields({
            角色编码: { error: { message: '角色编码已存在' } },
          })
          Message.error('角色编码已存在')
          return
        }
        createRole({
          角色编码: code,
          角色名称: name,
          角色说明: desc,
          启停用状态: 'ENABLED',
          创建人: 'admin',
          创建时间: t,
          最后修改人: 'admin',
          最后修改时间: t,
        })
        toastSaveSuccess(true)
        allowLeaveOnce()
        navigate('/settings/roles')
        return
      }

      const roles = listRoles().map((r) =>
        r.角色编码 === role!.角色编码
          ? {
              ...r,
              角色名称: name,
              角色说明: desc,
              最后修改人: 'admin',
              最后修改时间: t,
            }
          : r,
      )
      saveRoles(roles)
      toastSaveSuccess(false)
      allowLeaveOnce()
      navigate('/settings/roles')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      title={isNew ? '新增角色' : '编辑角色'}
      subTitle={isNew ? undefined : role!.角色编码}
      onBack={goBack}
    >
      <Card data-anno="role-form-fields">
        <Form
          ref={formRef}
          layout="horizontal"
          labelCol={{ flex: '100px' }}
          wrapperCol={{ flex: '480px' }}
          initialValues={initialValues}
          onValuesChange={(changed) => {
            if (Object.keys(changed).length > 0) setFormEdited(true)
          }}
          onSubmit={handleSubmit}
        >
          <Form.Item
            field="角色编码"
            label="角色编码"
            disabled={!isNew}
            rules={
              isNew
                ? [
                    { required: true, message: '请输入角色编码' },
                    {
                      validator: (value, callback) => {
                        const code = String(value ?? '').trim()
                        if (isValidRoleCode(code)) {
                          callback()
                          return
                        }
                        callback('角色编码须为大写字母开头，仅含字母、数字与下划线，2–32 位')
                      },
                    },
                  ]
                : undefined
            }
            extra={isNew ? '保存后不可修改；建议全大写英文与下划线' : undefined}
          >
            <Input
              maxLength={32}
              placeholder="如 CUSTOM_OPS"
              onChange={() => {
                formRef.current?.setFields({ 角色编码: { error: undefined } })
              }}
            />
          </Form.Item>
          <Form.Item
            field="角色名称"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item field="角色说明" label="角色说明">
            <Input.TextArea maxLength={200} rows={3} />
          </Form.Item>
          <div style={{ position: 'relative' }}>
            <span
              data-anno="role-form-actions"
              aria-hidden
              style={{
                position: 'absolute',
                right: 0,
                bottom: '100%',
                marginBottom: 6,
                width: 40,
                height: 12,
                pointerEvents: 'none',
              }}
            />
            <Space style={{ position: 'relative', zIndex: 2 }}>
              <Button type="default" onClick={goBack}>返回</Button>
              <Button type="primary" htmlType="submit" loading={saving}>保存</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </PageShell>
  )
}
