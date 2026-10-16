import {
  EditableProTable,
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components'
import type { ProColumns, ProFormInstance } from '@ant-design/pro-components'
import { App, Button, Card, message } from 'antd'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  const { modal } = App.useApp()
  const formRef = useRef<ProFormInstance>(null)
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
  const editableKeys = useMemo(() => roleRows.map((r) => r.id), [roleRows])
  const [saving, setSaving] = useState(false)
  const [formEdited, setFormEdited] = useState(false)
  const initialRoles = existing?.角色明细 ?? []
  const rolesDirty = isUserRoleRowsDirty(initialRoles, roleRows)
  const leaveDirty = formEdited || rolesDirty
  const { allowLeaveOnce } = useUnsavedLeaveBlocker(leaveDirty)

  const goUsersList = () =>
    confirmUnsavedNavigate(
      leaveDirty,
      () => {
        allowLeaveOnce()
        navigate('/settings/users')
      },
      modal,
    )

  const addRoleRow = () => {
    setRoleRows((prev) => [...prev, createRoleRow(prev)])
    setFormEdited(true)
  }

  const roleColumns: ProColumns<RoleRow>[] = useMemo(
    () => [
      {
        title: '角色编码',
        dataIndex: '角色编码',
        valueType: 'select',
        fieldProps: {
          options: enabledRoleOptions(),
          showSearch: true,
        },
        formItemProps: { rules: [{ required: true, message: '请选择角色' }] },
      },
      {
        title: '角色名称',
        dataIndex: '角色名称',
        editable: false,
        render: (_, row) =>
          listRoles().find((r) => r.角色编码 === row.角色编码)?.角色名称 ?? '-',
      },
      {
        title: '操作',
        valueType: 'option',
        width: 80,
      },
    ],
    [],
  )

  const wouldBreakAdminGuard = (nextRoles: RoleCode[]) => {
    if (!existing) return false
    const hadAdmin =
      existing.启停用状态 === 'ENABLED' &&
      existing.角色明细.some((r) => r.角色编码 === 'ADMIN')
    const stillHasAdmin = nextRoles.includes('ADMIN')
    if (!hadAdmin || stillHasAdmin) return false
    return countEnabledUsersWithAdmin() <= 1
  }

  return (
    <PageContainer
      title={isNew ? '新增用户' : '编辑用户'}
      onBack={goUsersList}
    >
      <ProForm
        formRef={formRef}
        onValuesChange={(changed) => {
          if (Object.keys(changed).length > 0) setFormEdited(true)
        }}
        layout="horizontal"
        labelCol={{ flex: '100px' }}
        wrapperCol={{ flex: '480px' }}
        onFinishFailed={() => toastFormValidateFailed()}
        initialValues={
          existing ?? {
            用户账号: '',
            用户姓名: '',
            手机号: '',
            邮箱: '',
            用户备注: '',
          }
        }
        submitter={{
          searchConfig: { submitText: '保存' },
          resetButtonProps: { style: { display: 'none' } },
          submitButtonProps: { loading: saving },
          render: (_props, dom) => (
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
                <Button type="default" htmlType="button" onClick={goUsersList}>
                  返回列表
                </Button>
                {dom[1]}
              </div>
            </div>
          ),
        }}
        onFinish={async (values) => {
          setSaving(true)
          try {
          const phone = String(values.手机号 ?? '').trim()
          const codes = roleRows.map((r) => r.角色编码).filter(Boolean) as RoleCode[]
          const dup = new Set(codes)
          if (dup.size !== codes.length) {
            message.error('同一角色不可重复添加')
            return false
          }
          if (wouldBreakAdminGuard(codes)) {
            message.error('须至少保留一名启用的管理员账号')
            return false
          }
          if (!isValidPhone(phone)) {
            formRef.current?.setFields([{ name: '手机号', errors: ['请输入有效的手机号或座机号'] }])
            message.error('请输入有效的手机号或座机号')
            return false
          }
          const email = String(values.邮箱 ?? '').trim()
          if (!isValidEmail(email)) {
            formRef.current?.setFields([{ name: '邮箱', errors: ['请输入有效的邮箱地址'] }])
            message.error('请输入有效的邮箱地址')
            return false
          }

          const users = listUsers()
          const t = nowString()
          if (isNew) {
            const acc = String(values.用户账号 ?? '').trim()
            if (users.some((u) => u.用户账号 === acc)) {
              formRef.current?.setFields([{ name: '用户账号', errors: ['用户账号已存在'] }])
              message.error('用户账号已存在')
              return false
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
          return true
          } finally {
            setSaving(false)
          }
        }}
      >
        <Card title="基本信息" style={{ marginBottom: 16 }} data-anno="user-form-basic">
          <ProFormText
            name="用户账号"
            label="用户账号"
            disabled={!isNew}
            rules={[{ required: true, message: '请输入用户账号' }]}
            fieldProps={{
              maxLength: 32,
              onChange: () => {
                formRef.current?.setFields([{ name: '用户账号', errors: [] }])
              },
            }}
          />
          <ProFormText
            name="用户姓名"
            label="用户姓名"
            rules={[{ required: true, message: '请输入用户姓名' }]}
            fieldProps={{ maxLength: 50 }}
          />
          <ProFormText
            name="手机号"
            label="手机号"
            fieldProps={{ maxLength: 20 }}
            rules={[
              {
                validator: async (_, value) => {
                  if (isValidPhone(String(value ?? ''))) return
                  throw new Error('请输入有效的手机号或座机号')
                },
              },
            ]}
          />
          <ProFormText
            name="邮箱"
            label="邮箱"
            fieldProps={{ maxLength: 100 }}
            rules={[
              {
                validator: async (_, value) => {
                  if (isValidEmail(String(value ?? ''))) return
                  throw new Error('请输入有效的邮箱地址')
                },
              },
            ]}
          />
          <ProFormTextArea name="用户备注" label="用户备注" fieldProps={{ maxLength: 200, rows: 3 }} />
        </Card>

        <Card title="已分配角色" style={{ marginBottom: 0 }} data-anno="user-form-roles">
          <EditableProTable<RoleRow>
            rowKey="id"
            columns={roleColumns}
            value={roleRows}
            onChange={(list) => {
              setRoleRows(mapRoleRowsWithNames(list as RoleRow[]))
              setFormEdited(true)
            }}
            recordCreatorProps={false}
            editable={{
              type: 'multiple',
              editableKeys,
              onChange: (keys) => {
                setRoleRows((rows) =>
                  mapRoleRowsWithNames(rows.filter((r) => keys.includes(r.id))),
                )
                setFormEdited(true)
              },
              onValuesChange: (_record, list) => {
                setRoleRows(mapRoleRowsWithNames(list as RoleRow[]))
                setFormEdited(true)
              },
              actionRender: (_row, _config, defaultDoms) => [defaultDoms.delete],
            }}
          />
          <Button
            type="dashed"
            block
            htmlType="button"
            style={{ marginTop: 8 }}
            onClick={addRoleRow}
          >
            + 添加角色
          </Button>
        </Card>
      </ProForm>
    </PageContainer>
  )
}
