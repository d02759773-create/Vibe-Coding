import { PageContainer, ProDescriptions } from '@ant-design/pro-components'
import { Button, Card, Modal, Space, Table, message } from 'antd'
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

export function UserDetail() {
  const { account } = useParams()
  const navigate = useNavigate()
  const user = account ? getUser(account) : undefined

  const [disableOpen, setDisableOpen] = useState(false)
  const [disableReason, setDisableReason] = useState('')

  if (!user) {
    return (
      <PageContainer title="用户不存在">
        <Button onClick={() => navigate('/settings/users')}>返回列表</Button>
      </PageContainer>
    )
  }

  const roles = listRoles()

  const handleDisable = () => {
    const reason = disableReason.trim()
    if (!reason) {
      message.error('请填写停用原因')
      return
    }
    const isLastAdmin =
      user.角色明细.some((r) => r.角色编码 === 'ADMIN') && countEnabledUsersWithAdmin() <= 1
    if (isLastAdmin) {
      message.error('无法停用：系统须至少保留一名启用的管理员')
      return
    }
    const users = listUsers().map((u) =>
      u.用户账号 === user.用户账号
        ? { ...u, 启停用状态: 'DISABLED' as const, 停用原因: reason, 最后修改时间: nowString() }
        : u,
    )
    saveUsers(users)
    message.success('已停用')
    setDisableOpen(false)
    navigate(0)
  }

  return (
    <PageContainer
      title={user.用户姓名}
      subTitle={user.用户账号}
      tags={<EnableStatusTag status={user.启停用状态} />}
      extra={
        <Space>
          <Button onClick={() => navigate(`/settings/users/${user.用户账号}/edit`)}>编辑</Button>
          {user.启停用状态 === 'ENABLED' ? (
            <Button danger onClick={() => setDisableOpen(true)}>停用</Button>
          ) : (
            <Button
              onClick={() => {
                const users = listUsers().map((u) =>
                  u.用户账号 === user.用户账号
                    ? { ...u, 启停用状态: 'ENABLED' as const, 最后修改时间: nowString() }
                    : u,
                )
                saveUsers(users)
                message.success('已启用')
                navigate(0)
              }}
            >
              启用
            </Button>
          )}
        </Space>
      }
      onBack={() => navigate('/settings/users')}
    >
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="用户账号">{user.用户账号}</ProDescriptions.Item>
          <ProDescriptions.Item label="用户姓名">{user.用户姓名}</ProDescriptions.Item>
          <ProDescriptions.Item label="手机号">{user.手机号 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="邮箱">{user.邮箱 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="启停用状态">
            <EnableStatusTag status={user.启停用状态} />
          </ProDescriptions.Item>
          <ProDescriptions.Item label="停用原因">
            {user.启停用状态 === 'ENABLED' ? '-' : user.停用原因 || '-'}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="用户备注">{user.用户备注 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="最后登录时间">{user.最后登录时间 || '-'}</ProDescriptions.Item>
          <ProDescriptions.Item label="已分配角色摘要">{roleSummary(user)}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>

      <Card title="已分配角色" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={false}
          rowKey="角色编码"
          dataSource={user.角色明细}
          columns={[
            { title: '角色编码', dataIndex: '角色编码' },
            {
              title: '角色名称',
              render: (_, row) => roles.find((r) => r.角色编码 === row.角色编码)?.角色名称 ?? '-',
            },
          ]}
          footer={() => `用户已分配角色数：${user.角色明细.length}`}
        />
      </Card>

      <Card title="系统信息">
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="创建人">{user.创建人}</ProDescriptions.Item>
          <ProDescriptions.Item label="创建时间">{user.创建时间}</ProDescriptions.Item>
          <ProDescriptions.Item label="最后修改人">{user.最后修改人}</ProDescriptions.Item>
          <ProDescriptions.Item label="最后修改时间">{user.最后修改时间}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/settings/audit-log">查看操作日志</Link>
      </div>

      <Modal
        title="停用用户"
        open={disableOpen}
        onCancel={() => setDisableOpen(false)}
        onOk={handleDisable}
        okText="确认停用"
      >
        <p>停用后该账号无法登录。</p>
        <textarea
          className="ant-input"
          rows={3}
          maxLength={200}
          placeholder="停用原因（必填）"
          value={disableReason}
          onChange={(e) => setDisableReason(e.target.value)}
        />
      </Modal>
    </PageContainer>
  )
}
