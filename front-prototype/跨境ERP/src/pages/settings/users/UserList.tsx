import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Button, Skeleton, Tabs, message } from 'antd'
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
import { settingsListSearch } from '@/pages/settings/proTableSearch'
import { TableRowActions, tableActionLink } from '@/pages/settings/tableActions'
import { tabCountLabel } from '@/pages/settings/tabCountLabel'
import { confirmEnableUser } from '@/pages/settings/users/confirmEnableUser'
import { DisableUserModal } from '@/pages/settings/users/DisableUserModal'
import { filterUserListRows, userListHasFilters } from '@/pages/settings/users/filterUserList'
import { SettingsListEmpty } from '@/pages/settings/settingsListEmpty'
import { withSettingsListLoading } from '@/pages/settings/settingsListFetch'

type StatusTab = 'all' | EnableStatus

export function UserList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  const [disableTarget, setDisableTarget] = useState<InternalUser | null>(null)
  const [tableLoading, setTableLoading] = useState(true)
  const [listFiltered, setListFiltered] = useState(false)

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
      render: (_, row) => (
        <TableRowActions
          items={[
            tableActionLink('查看', () => navigate(`/settings/users/${row.用户账号}`)),
            tableActionLink('编辑', () => navigate(`/settings/users/${row.用户账号}/edit`)),
            row.启停用状态 === 'ENABLED'
              ? tableActionLink('停用', () => setDisableTarget(row))
              : tableActionLink('启用', () =>
                  confirmEnableUser(row.用户账号, () => {
                    setRefreshKey((k) => k + 1)
                    actionRef.current?.reload()
                  }),
                ),
          ]}
        />
      ),
    },
  ]

  const handleDisableConfirm = (reason: string) => {
    if (!disableTarget) return
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
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  return (
    <PageContainer title="内部用户">
      <Tabs
        data-anno="user-list-tabs"
        activeKey={statusTab}
        onChange={(k) => {
          setStatusTab(k as StatusTab)
          actionRef.current?.reload()
        }}
        items={[
          { key: 'all', label: `全部 ${tabCountLabel(tabCounts.all)}` },
          { key: 'ENABLED', label: `启用 ${tabCountLabel(tabCounts.ENABLED)}` },
          { key: 'DISABLED', label: `停用 ${tabCountLabel(tabCounts.DISABLED)}` },
        ]}
        style={{ marginBottom: 0 }}
      />
      <div data-anno="user-list-table">
      <ProTable<InternalUser>
        actionRef={actionRef}
        rowKey="用户账号"
        columns={columns}
        search={{ ...settingsListSearch, className: 'user-list-search' }}
        locale={{
          emptyText: <SettingsListEmpty entityLabel="用户" filtered={listFiltered} />,
        }}
        tableRender={(_, dom) =>
          tableLoading ? (
            <div style={{ padding: 24, background: '#fff' }}>
              <Skeleton active paragraph={{ rows: 12 }} title={false} />
            </div>
          ) : (
            <div data-anno="user-list-table-body">{dom}</div>
          )
        }
        toolBarRender={() => [
          <span key="new" data-anno="user-list-toolbar">
            <Button type="primary" onClick={() => navigate('/settings/users/new')}>
              新增用户
            </Button>
          </span>,
        ]}
        pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
        options={false}
        request={async (params) => {
          setTableLoading(true)
          try {
            setListFiltered(userListHasFilters(params))
            const loaded = await withSettingsListLoading(() =>
              filterUserListRows(allUsers, statusTab, params),
            )
            if (!loaded.ok) {
              message.error('加载失败，请重试')
              return { data: [], success: false, total: 0 }
            }
            const rows = loaded.value
            return { data: rows, success: true, total: rows.length }
          } finally {
            setTableLoading(false)
          }
        }}
      />
      </div>
      <DisableUserModal
        open={!!disableTarget}
        onCancel={() => setDisableTarget(null)}
        onConfirm={handleDisableConfirm}
      />
    </PageContainer>
  )
}
