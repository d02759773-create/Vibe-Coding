import { PageContainer, ProDescriptions } from '@ant-design/pro-components'
import { Button, Card, Modal, Space, Table, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
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
  const code = roleCode as RoleCode
  const role = getRole(code)

  if (!role) {
    return (
      <PageContainer title="角色不存在">
        <Button onClick={() => navigate('/settings/roles')}>返回列表</Button>
      </PageContainer>
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
        message.success(next === 'DISABLED' ? '角色已停用' : '已启用')
        navigate(0)
      },
    })
  }

  return (
    <PageContainer
      title={role.角色名称}
      subTitle={role.角色编码}
      tags={<EnableStatusTag status={role.启停用状态} />}
      extra={
        <Space>
          <Button onClick={() => navigate(`/settings/roles/${code}/permissions`)}>配置权限</Button>
          <Button onClick={() => navigate(`/settings/roles/${code}/edit`)}>编辑</Button>
          <Button onClick={toggleStatus}>
            {role.启停用状态 === 'ENABLED' ? '停用' : '启用'}
          </Button>
        </Space>
      }
      onBack={() => navigate('/settings/roles')}
    >
      <Card title="角色信息" style={{ marginBottom: 16 }}>
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="角色编码">{role.角色编码}</ProDescriptions.Item>
          <ProDescriptions.Item label="角色名称">{role.角色名称}</ProDescriptions.Item>
          <ProDescriptions.Item label="角色说明">{role.角色说明 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="启停用状态">
            <EnableStatusTag status={role.启停用状态} />
          </ProDescriptions.Item>
          <ProDescriptions.Item label="关联用户数">{countUsersForRole(code)}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>

      <Card title="菜单权限（只读）" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          rowKey="二级菜单编码"
          dataSource={permRows}
          columns={[
            { title: '一级菜单', dataIndex: '一级菜单名称', width: 120 },
            { title: '二级菜单', dataIndex: '二级菜单名称' },
            {
              title: '菜单可见性',
              dataIndex: '菜单可见性',
              width: 100,
              render: (v) => (v === 'VISIBLE' ? '可见' : '不可见'),
            },
          ]}
        />
      </Card>

      <Card title="系统信息">
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="创建人">{role.创建人}</ProDescriptions.Item>
          <ProDescriptions.Item label="创建时间">{role.创建时间}</ProDescriptions.Item>
          <ProDescriptions.Item label="最后修改人">{role.最后修改人}</ProDescriptions.Item>
          <ProDescriptions.Item label="最后修改时间">{role.最后修改时间}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>
    </PageContainer>
  )
}
