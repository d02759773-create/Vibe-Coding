import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Button, Input, Modal, Space, Tabs, message } from 'antd'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EnableStatusTag } from '@/components/settings/EnableStatusTag'
import type { EnableStatus } from '@/features/settings/constants'
import {
  countEnabledUsersWithAdmin,
  listUsers,
  nowString,
  roleSummary,
  saveUsers,
} from '@/features/settings/storage'
import type { InternalUser } from '@/features/settings/types'

type StatusTab = 'all' | EnableStatus

export function UserList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  const [disableTarget, setDisableTarget] = useState<InternalUser | null>(null)
  const [disableReason, setDisableReason] = useState('')

  const allUsers = useMemo(() => {
    void refreshKey
    return listUsers()
  }, [refreshKey])

  const tabCounts = useMemo(() => {
    const enabled = allUsers.filter((u) => u.启停用状态 === 'ENABLED').length
    const disabled = allUsers.filter((u) => u.启停用状态 === 'DISABLED').length
    return { all: allUsers.length, ENABLED: enabled, DISABLED: disabled }
  }, [allUsers])

  const columns: ProColumns<InternalUser>[] = [
    {
      title: '用户账号',
      dataIndex: '用户账号',
      width: 140,
      fixed: 'left',
      render: (_, row) => <Link to={`/settings/users/${row.用户账号}`}>{row.用户账号}</Link>,
    },
    { title: '用户姓名', dataIndex: '用户姓名', width: 120 },
    {
      title: '已分配角色摘要',
      dataIndex: '已分配角色摘要',
      width: 200,
      search: false,
      render: (_, row) => roleSummary(row),
    },
    {
      title: '启停用状态',
      dataIndex: '启停用状态',
      width: 90,
      search: statusTab === 'all' ? undefined : false,
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '启用' },
        DISABLED: { text: '停用' },
      },
      render: (_, row) => <EnableStatusTag status={row.启停用状态} />,
    },
    {
      title: '最后登录时间',
      dataIndex: '最后登录时间',
      width: 160,
      valueType: 'dateTimeRange',
      search: {
        transform: (v) => ({ 最后登录时间: v }),
      },
      render: (_, row) => row.最后登录时间 || '-',
      sorter: (a, b) => (a.最后登录时间 || '').localeCompare(b.最后登录时间 || ''),
    },
    {
      title: '最后修改时间',
      dataIndex: '最后修改时间',
      width: 160,
      search: false,
    },
    {
      title: '手机号',
      dataIndex: '手机号',
      hideInTable: true,
    },
    {
      title: '邮箱',
      dataIndex: '邮箱',
      hideInTable: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, row) => {
        const actions = [
          <a key="view" onClick={() => navigate(`/settings/users/${row.用户账号}`)}>查看</a>,
          <a key="edit" onClick={() => navigate(`/settings/users/${row.用户账号}/edit`)}>编辑</a>,
        ]
        if (row.启停用状态 === 'ENABLED') {
          actions.push(
            <a key="disable" onClick={() => setDisableTarget(row)}>停用</a>,
          )
        } else {
          actions.push(
            <a
              key="enable"
              onClick={() => {
                const users = listUsers().map((u) =>
                  u.用户账号 === row.用户账号
                    ? { ...u, 启停用状态: 'ENABLED' as const, 最后修改时间: nowString() }
                    : u,
                )
                saveUsers(users)
                message.success('已启用')
                setRefreshKey((k) => k + 1)
                actionRef.current?.reload()
              }}
            >
              启用
            </a>,
          )
        }
        return actions
      },
    },
  ]

  const confirmDisable = () => {
    if (!disableTarget) return
    const reason = disableReason.trim()
    if (!reason || reason.length > 200) {
      message.error('请填写停用原因（1-200 字）')
      return
    }
    const isLastAdmin =
      disableTarget.启停用状态 === 'ENABLED' &&
      disableTarget.角色明细.some((r) => r.角色编码 === 'ADMIN') &&
      countEnabledUsersWithAdmin() <= 1
    if (isLastAdmin) {
      message.error('无法停用：系统须至少保留一名启用的管理员')
      return
    }
    const users = listUsers().map((u) =>
      u.用户账号 === disableTarget.用户账号
        ? {
            ...u,
            启停用状态: 'DISABLED' as const,
            停用原因: reason,
            最后修改时间: nowString(),
          }
        : u,
    )
    saveUsers(users)
    message.success('已停用')
    setDisableTarget(null)
    setDisableReason('')
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  return (
    <PageContainer
      title="内部用户"
      extra={
        <Space>
          <Button onClick={() => navigate('/settings/roles')}>角色管理</Button>
          <Button type="primary" onClick={() => navigate('/settings/users/new')}>
            新增用户
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={statusTab}
        onChange={(k) => {
          setStatusTab(k as StatusTab)
          actionRef.current?.reload()
        }}
        items={[
          { key: 'all', label: `全部 ${tabCounts.all}` },
          { key: 'ENABLED', label: `启用 ${tabCounts.ENABLED}` },
          { key: 'DISABLED', label: `停用 ${tabCounts.DISABLED}` },
        ]}
        style={{ marginBottom: 16 }}
      />
      <ProTable<InternalUser>
        actionRef={actionRef}
        rowKey="用户账号"
        columns={columns}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
        options={false}
        request={async (params) => {
          let rows = [...allUsers]
          if (statusTab !== 'all') {
            rows = rows.filter((u) => u.启停用状态 === statusTab)
          }
          const account = String(params.用户账号 ?? '').trim().toLowerCase()
          const name = String(params.用户姓名 ?? '').trim().toLowerCase()
          const phone = String(params.手机号 ?? '').trim().toLowerCase()
          const email = String(params.邮箱 ?? '').trim().toLowerCase()
          const status = params.启停用状态 as EnableStatus | undefined
          if (account) rows = rows.filter((u) => u.用户账号.toLowerCase().includes(account))
          if (name) rows = rows.filter((u) => u.用户姓名.toLowerCase().includes(name))
          if (phone) rows = rows.filter((u) => u.手机号.toLowerCase().includes(phone))
          if (email) rows = rows.filter((u) => u.邮箱.toLowerCase().includes(email))
          if (statusTab === 'all' && status) {
            rows = rows.filter((u) => u.启停用状态 === status)
          }
          return { data: rows, success: true, total: rows.length }
        }}
      />
      <Modal
        title="停用用户"
        open={!!disableTarget}
        onCancel={() => {
          setDisableTarget(null)
          setDisableReason('')
        }}
        onOk={confirmDisable}
        okText="确认停用"
      >
        <p>停用后该账号无法登录。</p>
        <Input.TextArea
          rows={3}
          placeholder="停用原因（必填，1-200 字）"
          value={disableReason}
          onChange={(e) => setDisableReason(e.target.value)}
          maxLength={200}
          showCount
        />
      </Modal>
    </PageContainer>
  )
}
