import { Button, Card, Descriptions, Message, Modal, Space, Table } from '@arco-design/web-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { EnableStatusTag } from '@/components/settings/EnableStatusTag'
import type { EnableStatus, RoleCode } from '@/features/settings/constants'
import {
  countUsersForRole,
  getRole,
  getRolePermissionRows,
  listRoles,
  nowString,
  saveRoles,
} from '@/features/settings/storage'

export function RoleDetail() {
  const { roleCode } = useParams()
  const navigate = useNavigate()
  if (roleCode === 'new') {
    return <Navigate to="/settings/roles/new" replace />
  }

  const code = roleCode as RoleCode
  const role = getRole(code)

  if (!role) {
    return (
      <PageShell title="角色不存在">
        <Button onClick={() => navigate('/settings/roles')}>返回列表</Button>
      </PageShell>
    )
  }

  const permRows = getRolePermissionRows(code)

  const toggleStatus = () => {
    const next: EnableStatus = role.启停用状态 === 'ENABLED' ? 'DISABLED' : 'ENABLED'
    Modal.confirm({
      title: next === 'DISABLED' ? '停用角色' : '启用角色',
      onOk: () => {
        const roles = listRoles().map((r) =>
          r.角色编码 === code ? { ...r, 启停用状态: next, 最后修改时间: nowString() } : r,
        )
        saveRoles(roles)
        Message.success(next === 'DISABLED' ? '角色已停用' : '已启用')
        navigate(0)
      },
    })
  }

  return (
    <PageShell
      title={role.角色名称}
      subTitle={role.角色编码}
      tags={<EnableStatusTag status={role.启停用状态} />}
      extra={
        <Space data-anno="role-detail-header">
          <Button onClick={() => navigate(`/settings/roles/${code}/permissions`)}>配置权限</Button>
          <Button onClick={() => navigate(`/settings/roles/${code}/edit`)}>编辑</Button>
          <Button onClick={toggleStatus}>
            {role.启停用状态 === 'ENABLED' ? '停用' : '启用'}
          </Button>
        </Space>
      }
      onBack={() => navigate('/settings/roles')}
    >
      <div data-anno="role-detail-body">
        <Card title="角色信息" style={{ marginBottom: 16 }}>
          <Descriptions column={2} data={[
            { label: '角色编码', value: role.角色编码 },
            { label: '角色名称', value: role.角色名称 },
            { label: '角色说明', value: role.角色说明 || '-' },
            { label: '启停用状态', value: <EnableStatusTag status={role.启停用状态} /> },
            { label: '关联用户数', value: countUsersForRole(code) },
          ]} />
        </Card>

        <Card title="菜单权限（只读）" style={{ marginBottom: 16 }}>
          <Table
            size="small"
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            rowKey="二级菜单编码"
            data={permRows}
            columns={[
              { title: '一级菜单', dataIndex: '一级菜单名称', width: 112 },
              { title: '二级菜单', dataIndex: '二级菜单名称', ellipsis: true },
              {
                title: '菜单可见性',
                dataIndex: '菜单可见性',
                width: 140,
                align: 'center',
                render: (v) => (v === 'VISIBLE' ? '可见' : '不可见'),
              },
            ]}
          />
        </Card>

        <Card title="系统信息">
          <Descriptions column={2} data={[
            { label: '创建人', value: role.创建人 },
            { label: '创建时间', value: role.创建时间 },
            { label: '最后修改人', value: role.最后修改人 },
            { label: '最后修改时间', value: role.最后修改时间 },
          ]} />
        </Card>
      </div>
    </PageShell>
  )
}
