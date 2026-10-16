import {
  EditableProTable,
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { Button, Card, Space, message } from 'antd'
import { useMemo, useState, type Key } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { isValidPhone, type RoleCode } from '@/features/settings/constants'
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

type RoleRow = UserRoleAssignment & { id: string; 角色名称?: string }

export function UserForm() {
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
  const [editableKeys, setEditableKeys] = useState<Key[]>(() =>
    roleRows.map((r) => r.id),
  )

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
      onBack={() => navigate('/settings/users')}
    >
      <ProForm
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
          render: () => (
            <Space style={{ marginTop: 24 }}>
              <Button onClick={() => navigate('/settings/users')}>返回列表</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          ),
        }}
        onFinish={async (values) => {
          const phone = String(values.手机号 ?? '').trim()
          if (!isValidPhone(phone)) {
            message.error('请输入有效的手机号或座机号')
            return false
          }
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

          const users = listUsers()
          const t = nowString()
          if (isNew) {
            const acc = String(values.用户账号 ?? '').trim()
            if (users.some((u) => u.用户账号 === acc)) {
              message.error('用户账号已存在')
              return false
            }
            users.push({
              用户账号: acc,
              用户姓名: String(values.用户姓名 ?? '').trim(),
              手机号: phone,
              邮箱: String(values.邮箱 ?? '').trim(),
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
              邮箱: String(values.邮箱 ?? '').trim(),
              用户备注: String(values.用户备注 ?? '').trim(),
              角色明细: codes.map((c) => ({ 角色编码: c })),
              最后修改人: 'admin',
              最后修改时间: t,
            }
          }
          saveUsers(users)
          message.success('保存成功')
          const target = isNew ? String(values.用户账号).trim() : existing!.用户账号
          navigate(`/settings/users/${target}/edit`)
          return true
        }}
      >
        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <ProFormText
            name="用户账号"
            label="用户账号"
            disabled={!isNew}
            rules={[{ required: true, message: '请输入用户账号' }]}
            fieldProps={{ maxLength: 32 }}
          />
          <ProFormText
            name="用户姓名"
            label="用户姓名"
            rules={[{ required: true, message: '请输入用户姓名' }]}
            fieldProps={{ maxLength: 50 }}
          />
          <ProFormText name="手机号" label="手机号" fieldProps={{ maxLength: 20 }} />
          <ProFormText name="邮箱" label="邮箱" fieldProps={{ maxLength: 100 }} />
          <ProFormTextArea name="用户备注" label="用户备注" fieldProps={{ maxLength: 200, rows: 3 }} />
        </Card>
      </ProForm>

      <Card title="已分配角色">
        <EditableProTable<RoleRow>
          rowKey="id"
          columns={roleColumns}
          value={roleRows}
          onChange={(v) => {
            const next = v.map((row) => ({
              ...row,
              角色名称: listRoles().find((r) => r.角色编码 === row.角色编码)?.角色名称,
            }))
            setRoleRows(next)
          }}
          recordCreatorProps={{
            position: 'bottom',
            record: () => ({ id: `new-${Date.now()}`, 角色编码: 'OPS_SPECIALIST' as RoleCode }),
            creatorButtonText: '添加角色',
          }}
          editable={{
            type: 'multiple',
            editableKeys,
            onChange: setEditableKeys,
            actionRender: (_row, _config, defaultDoms) => [defaultDoms.delete],
          }}
        />
      </Card>
    </PageContainer>
  )
}
