import { PageContainer, ProDescriptions } from '@ant-design/pro-components'
import { Button, Card, Space, Table, message } from 'antd'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EnableStatusTag } from '@/components/settings/EnableStatusTag'
import {
  countEnabledUsersWithAdmin,
  getUser,
  listRoles,
  listUsers,
  nowString,
  roleSummary,
  saveUsers,
} from '@/features/settings/storage'
import { confirmEnableUser } from '@/pages/settings/users/confirmEnableUser'
import { DisableUserModal } from '@/pages/settings/users/DisableUserModal'

export function UserDetail() {
  const { account } = useParams()
  const navigate = useNavigate()
  const [disableOpen, setDisableOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  void refreshKey
  const current = account ? getUser(account) : undefined

  if (!current) {
    return (
      <PageContainer title="用户不存在">
        <Button onClick={() => navigate('/settings/users')}>返回列表</Button>
      </PageContainer>
    )
  }

  const roles = listRoles()

  const handleDisableConfirm = (reason: string) => {
    const isLastAdmin =
      current.角色明细.some((r) => r.角色编码 === 'ADMIN') && countEnabledUsersWithAdmin() <= 1
    if (isLastAdmin) {
      message.error('无法停用：系统须至少保留一名启用的管理员')
      return
    }
    const users = listUsers().map((u) =>
      u.用户账号 === current.用户账号
        ? { ...u, 启停用状态: 'DISABLED' as const, 停用原因: reason, 最后修改时间: nowString() }
        : u,
    )
    saveUsers(users)
    message.success('已停用')
    setDisableOpen(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <PageContainer
      title={current.用户姓名}
      subTitle={current.用户账号}
      tags={<EnableStatusTag status={current.启停用状态} />}
      extra={
        <Space data-anno="user-detail-header">
          <Button onClick={() => navigate(`/settings/users/${current.用户账号}/edit`)}>编辑</Button>
          {current.启停用状态 === 'ENABLED' ? (
            <Button danger onClick={() => setDisableOpen(true)}>停用</Button>
          ) : (
            <Button onClick={() => confirmEnableUser(current.用户账号, () => setRefreshKey((k) => k + 1))}>
              启用
            </Button>
          )}
        </Space>
      }
      onBack={() => navigate('/settings/users')}
    >
      <div data-anno="user-detail-body">
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="用户账号">{current.用户账号}</ProDescriptions.Item>
          <ProDescriptions.Item label="用户姓名">{current.用户姓名}</ProDescriptions.Item>
          <ProDescriptions.Item label="手机号">{current.手机号 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="邮箱">{current.邮箱 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="启停用状态">
            <EnableStatusTag status={current.启停用状态} />
          </ProDescriptions.Item>
          <ProDescriptions.Item label="停用原因">
            {current.启停用状态 === 'ENABLED' ? '-' : current.停用原因 || '-'}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="用户备注">{current.用户备注 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="最后登录时间">{current.最后登录时间 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="已分配角色摘要">{roleSummary(current)}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>

      <Card title="已分配角色" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={false}
          rowKey="角色编码"
          dataSource={current.角色明细}
          columns={[
            { title: '角色编码', dataIndex: '角色编码' },
            {
              title: '角色名称',
              render: (_, row) => roles.find((r) => r.角色编码 === row.角色编码)?.角色名称 ?? '-',
            },
          ]}
          footer={() => `用户已分配角色数：${current.角色明细.length}`}
        />
      </Card>

      <Card title="系统信息">
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="创建人">{current.创建人}</ProDescriptions.Item>
          <ProDescriptions.Item label="创建时间">{current.创建时间}</ProDescriptions.Item>
          <ProDescriptions.Item label="最后修改人">{current.最后修改人}</ProDescriptions.Item>
          <ProDescriptions.Item label="最后修改时间">{current.最后修改时间}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>
      </div>

      <div style={{ marginTop: 16 }} data-anno="user-detail-audit">
        <Link to="/settings/audit-log">查看操作日志</Link>
      </div>

      <DisableUserModal
        open={disableOpen}
        onCancel={() => setDisableOpen(false)}
        onConfirm={handleDisableConfirm}
      />
    </PageContainer>
  )
}
