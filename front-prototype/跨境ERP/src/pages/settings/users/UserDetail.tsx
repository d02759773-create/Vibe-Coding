import { Button, Card, Descriptions, Message, Space, Table, Typography } from '@arco-design/web-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
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
      <PageShell title="用户不存在">
        <Button onClick={() => navigate('/settings/users')}>返回列表</Button>
      </PageShell>
    )
  }

  const roles = listRoles()

  const handleDisableConfirm = (reason: string) => {
    const isLastAdmin =
      current.角色明细.some((r) => r.角色编码 === 'ADMIN') && countEnabledUsersWithAdmin() <= 1
    if (isLastAdmin) {
      Message.error('无法停用：系统须至少保留一名启用的管理员')
      return
    }
    const users = listUsers().map((u) =>
      u.用户账号 === current.用户账号
        ? { ...u, 启停用状态: 'DISABLED' as const, 停用原因: reason, 最后修改时间: nowString() }
        : u,
    )
    saveUsers(users)
    Message.success('已停用')
    setDisableOpen(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <PageShell
      title={current.用户姓名}
      subTitle={current.用户账号}
      tags={<EnableStatusTag status={current.启停用状态} />}
      extra={
        <Space data-anno="user-detail-header">
          <Button onClick={() => navigate(`/settings/users/${current.用户账号}/edit`)}>编辑</Button>
          {current.启停用状态 === 'ENABLED' ? (
            <Button status="danger" onClick={() => setDisableOpen(true)}>停用</Button>
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
          <Descriptions column={2} data={[
            { label: '用户账号', value: current.用户账号 },
            { label: '用户姓名', value: current.用户姓名 },
            { label: '手机号', value: current.手机号 || '-' },
            { label: '邮箱', value: current.邮箱 || '-' },
            { label: '启停用状态', value: <EnableStatusTag status={current.启停用状态} /> },
            {
              label: '停用原因',
              value: current.启停用状态 === 'ENABLED' ? '-' : current.停用原因 || '-',
            },
            { label: '用户备注', value: current.用户备注 || '-' },
            { label: '最后登录时间', value: current.最后登录时间 || '-' },
            { label: '已分配角色摘要', value: roleSummary(current) },
          ]} />
        </Card>

        <Card title="已分配角色" style={{ marginBottom: 16 }}>
          <Table
            size="small"
            pagination={false}
            rowKey="角色编码"
            data={current.角色明细}
            columns={[
              { title: '角色编码', dataIndex: '角色编码' },
              {
                title: '角色名称',
                render: (_, row) => roles.find((r) => r.角色编码 === row.角色编码)?.角色名称 ?? '-',
              },
            ]}
          />
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            用户已分配角色数：{current.角色明细.length}
          </Typography.Text>
        </Card>

        <Card title="系统信息">
          <Descriptions column={2} data={[
            { label: '创建人', value: current.创建人 },
            { label: '创建时间', value: current.创建时间 },
            { label: '最后修改人', value: current.最后修改人 },
            { label: '最后修改时间', value: current.最后修改时间 },
          ]} />
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
    </PageShell>
  )
}
