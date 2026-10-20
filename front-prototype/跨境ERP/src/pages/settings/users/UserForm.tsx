import { Button, Card, Form, Input, Message, Select, Table } from '@arco-design/web-react'
import type { FormInstance } from '@arco-design/web-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { isValidEmail, isValidPhone, type RoleCode } from '@/features/settings/constants'
import {
  countEnabledUsersWithAdmin,
  enabledRoleOptions,
  getUser,
  listRoles,
  listUsers,
  nowString,
  saveUsers,
} from '@/features/settings/storage'
import type { UserRoleAssignment } from '@/features/settings/types'
import { confirmUnsavedNavigate } from '@/pages/settings/confirmUnsavedLeave'
import { toastFormValidateFailed, toastSaveSuccess } from '@/pages/settings/formFeedback'
import { useUnsavedLeaveBlocker } from '@/pages/settings/useUnsavedLeaveBlocker'
import { isUserRoleRowsDirty } from '@/pages/settings/users/userRoleRowsDirty'

type RoleRow = UserRoleAssignment & { id: string; 角色名称?: string }

function mapRoleRowsWithNames(rows: RoleRow[]): RoleRow[] {
  return rows.map((row) => ({
    ...row,
    角色名称: listRoles().find((r) => r.角色编码 === row.角色编码)?.角色名称,
  }))
}

function createRoleRow(existingRows: RoleRow[]): RoleRow {
  const used = new Set(existingRows.map((r) => r.角色编码))
  const pick = enabledRoleOptions().find((o) => !used.has(String(o.value)))
  const code = (pick?.value ?? 'OPS_SPECIALIST') as RoleCode
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    角色编码: code,
    角色名称: listRoles().find((r) => r.角色编码 === code)?.角色名称,
  }
}

export function UserForm() {
  const formRef = useRef<FormInstance>(null)
  const { account } = useParams()
  const navigate = useNavigate()
  const isNew = !account || account === 'new'
  const existing = !isNew ? getUser(account!) : undefined

  const [roleRows, setRoleRows] = useState<RoleRow[]>(() =>
    (existing?.角色明细 ?? []).map((r, i) => ({
      ...r,
      id: `${r.角色编码}-${i}`,
      角色名称: listRoles().find((x) => x.角色编码 === r.角色编码)?.角色名称,
    })),
  )
  const [saving, setSaving] = useState(false)
  const [formEdited, setFormEdited] = useState(false)
  const initialRoles = existing?.角色明细 ?? []
  const rolesDirty = isUserRoleRowsDirty(initialRoles, roleRows)
  const leaveDirty = formEdited || rolesDirty
  const { allowLeaveOnce } = useUnsavedLeaveBlocker(leaveDirty)

  const roleOptions = useMemo(() => enabledRoleOptions(), [])

  const goUsersList = () =>
    confirmUnsavedNavigate(leaveDirty, () => {
      allowLeaveOnce()
      navigate('/settings/users')
    })

  const addRoleRow = () => {
    setRoleRows((prev) => [...prev, createRoleRow(prev)])
    setFormEdited(true)
  }

  const updateRoleCode = (id: string, code: RoleCode) => {
    setRoleRows((prev) =>
      mapRoleRowsWithNames(
        prev.map((r) => (r.id === id ? { ...r, 角色编码: code } : r)),
      ),
    )
    setFormEdited(true)
  }

  const removeRoleRow = (id: string) => {
    setRoleRows((prev) => mapRoleRowsWithNames(prev.filter((r) => r.id !== id)))
    setFormEdited(true)
  }

  const wouldBreakAdminGuard = (nextRoles: RoleCode[]) => {
    if (!existing) return false
    const hadAdmin =
      existing.启停用状态 === 'ENABLED' &&
      existing.角色明细.some((r) => r.角色编码 === 'ADMIN')
    const stillHasAdmin = nextRoles.includes('ADMIN')
    if (!hadAdmin || stillHasAdmin) return false
    return countEnabledUsersWithAdmin() <= 1
  }

  const initialValues = existing ?? {
    用户账号: '',
    用户姓名: '',
    手机号: '',
    邮箱: '',
    用户备注: '',
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
      const phone = String(values.手机号 ?? '').trim()
      const codes = roleRows.map((r) => r.角色编码).filter(Boolean) as RoleCode[]
      const dup = new Set(codes)
      if (dup.size !== codes.length) {
        Message.error('同一角色不可重复添加')
        return
      }
      if (wouldBreakAdminGuard(codes)) {
        Message.error('须至少保留一名启用的管理员账号')
        return
      }
      if (!isValidPhone(phone)) {
        form.setFields({ 手机号: { error: { message: '请输入有效的手机号或座机号' } } })
        Message.error('请输入有效的手机号或座机号')
        return
      }
      const email = String(values.邮箱 ?? '').trim()
      if (!isValidEmail(email)) {
        form.setFields({ 邮箱: { error: { message: '请输入有效的邮箱地址' } } })
        Message.error('请输入有效的邮箱地址')
        return
      }

      const users = listUsers()
      const t = nowString()
      if (isNew) {
        const acc = String(values.用户账号 ?? '').trim()
        if (users.some((u) => u.用户账号 === acc)) {
          form.setFields({ 用户账号: { error: { message: '用户账号已存在' } } })
          Message.error('用户账号已存在')
          return
        }
        users.push({
          用户账号: acc,
          用户姓名: String(values.用户姓名 ?? '').trim(),
          手机号: phone,
          邮箱: email,
          用户备注: String(values.用户备注 ?? '').trim(),
          启停用状态: 'ENABLED',
          停用原因: '',
          最后登录时间: '',
          角色明细: codes.map((c) => ({ 角色编码: c })),
          创建人: 'admin',
          创建时间: t,
          最后修改人: 'admin',
          最后修改时间: t,
        })
      } else if (existing) {
        const idx = users.findIndex((u) => u.用户账号 === existing.用户账号)
        users[idx] = {
          ...existing,
          用户姓名: String(values.用户姓名 ?? '').trim(),
          手机号: phone,
          邮箱: email,
          用户备注: String(values.用户备注 ?? '').trim(),
          角色明细: codes.map((c) => ({ 角色编码: c })),
          最后修改人: 'admin',
          最后修改时间: t,
        }
      }
      saveUsers(users)
      toastSaveSuccess(isNew)
      allowLeaveOnce()
      navigate('/settings/users')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell title={isNew ? '新增用户' : '编辑用户'} onBack={goUsersList}>
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
        <Card title="基本信息" style={{ marginBottom: 16 }} data-anno="user-form-basic">
          <Form.Item
            field="用户账号"
            label="用户账号"
            disabled={!isNew}
            rules={[{ required: true, message: '请输入用户账号' }]}
          >
            <Input
              maxLength={32}
              onChange={() => {
                formRef.current?.setFields({ 用户账号: { error: undefined } })
              }}
            />
          </Form.Item>
          <Form.Item
            field="用户姓名"
            label="用户姓名"
            rules={[{ required: true, message: '请输入用户姓名' }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            field="手机号"
            label="手机号"
            rules={[
              {
                validator: (value, callback) => {
                  if (isValidPhone(String(value ?? ''))) {
                    callback()
                    return
                  }
                  callback('请输入有效的手机号或座机号')
                },
              },
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item
            field="邮箱"
            label="邮箱"
            rules={[
              {
                validator: (value, callback) => {
                  if (isValidEmail(String(value ?? ''))) {
                    callback()
                    return
                  }
                  callback('请输入有效的邮箱地址')
                },
              },
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item field="用户备注" label="用户备注">
            <Input.TextArea maxLength={200} rows={3} />
          </Form.Item>
        </Card>

        <Card title="已分配角色" style={{ marginBottom: 0 }} data-anno="user-form-roles">
          <Table<RoleRow>
            rowKey="id"
            pagination={false}
            data={roleRows}
            columns={[
              {
                title: '角色编码',
                dataIndex: '角色编码',
                render: (_, row) => (
                  <Select
                    value={row.角色编码}
                    options={roleOptions}
                    showSearch
                    style={{ width: 200 }}
                    onChange={(v) => updateRoleCode(row.id, v as RoleCode)}
                  />
                ),
              },
              {
                title: '角色名称',
                render: (_, row) =>
                  listRoles().find((r) => r.角色编码 === row.角色编码)?.角色名称 ?? '-',
              },
              {
                title: '操作',
                width: 80,
                render: (_, row) => (
                  <Button type="text" status="danger" onClick={() => removeRoleRow(row.id)}>
                    删除
                  </Button>
                ),
              },
            ]}
          />
          <Button
            type="dashed"
            long
            style={{ marginTop: 8 }}
            onClick={addRoleRow}
          >
            + 添加角色
          </Button>
        </Card>

        <div style={{ marginTop: 24, position: 'relative' }}>
          <span
            data-anno="user-form-actions"
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Button type="default" onClick={goUsersList}>返回列表</Button>
            <Button type="primary" htmlType="submit" loading={saving}>保存</Button>
          </div>
        </div>
      </Form>
    </PageShell>
  )
}
