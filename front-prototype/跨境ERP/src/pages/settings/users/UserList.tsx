import { Button, Message, Tabs } from '@arco-design/web-react'
import type { ColumnProps } from '@arco-design/web-react/es/Table'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import {
  SettingsListTable,
  type SettingsListTableAction,
  type SettingsSearchField,
} from '@/components/settings/SettingsListTable'
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
  const actionRef = useRef<SettingsListTableAction>(null)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  const [disableTarget, setDisableTarget] = useState<InternalUser | null>(null)
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

  const searchFields: SettingsSearchField[] = useMemo(
    () => [
      { name: '用户账号', label: '用户账号', type: 'text' },
      { name: '用户姓名', label: '用户姓名', type: 'text' },
      {
        name: '启停用状态',
        label: '启停用状态',
        type: 'select',
        options: [
          { label: '启用', value: 'ENABLED' },
          { label: '停用', value: 'DISABLED' },
        ],
        hidden: statusTab !== 'all',
      },
      { name: '最后登录时间', label: '最后登录时间', type: 'dateTimeRange' },
      { name: '手机号', label: '手机号', type: 'text' },
      { name: '邮箱', label: '邮箱', type: 'text' },
    ],
    [statusTab],
  )

  const columns: ColumnProps<InternalUser>[] = [
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
      width: 200,
      render: (_, row) => roleSummary(row),
    },
    {
      title: '启停用状态',
      dataIndex: '启停用状态',
      width: 90,
      render: (_, row) => <EnableStatusTag status={row.启停用状态} />,
    },
    {
      title: '最后登录时间',
      dataIndex: '最后登录时间',
      width: 160,
      render: (_, row) => row.最后登录时间 || '-',
      sorter: (a, b) => (a.最后登录时间 || '').localeCompare(b.最后登录时间 || ''),
    },
    {
      title: '最后修改时间',
      dataIndex: '最后修改时间',
      width: 160,
    },
    {
      title: '操作',
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
      Message.error('无法停用：系统须至少保留一名启用的管理员')
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
    Message.success('已停用')
    setDisableTarget(null)
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  const request = useMemo(
    () => async (params: Record<string, unknown>) => {
      setListFiltered(userListHasFilters(params))
      const loaded = await withSettingsListLoading(() =>
        filterUserListRows(allUsers, statusTab, params),
      )
      if (!loaded.ok) {
        Message.error('加载失败，请重试')
        return { data: [], success: false, total: 0 }
      }
      const rows = loaded.value
      return { data: rows, success: true, total: rows.length }
    },
    [allUsers, statusTab],
  )

  return (
    <PageShell title="内部用户">
      <Tabs
        data-anno="user-list-tabs"
        activeTab={statusTab}
        onChange={(k) => {
          setStatusTab(k as StatusTab)
          actionRef.current?.reload()
        }}
        style={{ marginBottom: 0 }}
      >
        <Tabs.TabPane key="all" title={`全部 ${tabCountLabel(tabCounts.all)}`} />
        <Tabs.TabPane key="ENABLED" title={`启用 ${tabCountLabel(tabCounts.ENABLED)}`} />
        <Tabs.TabPane key="DISABLED" title={`停用 ${tabCountLabel(tabCounts.DISABLED)}`} />
      </Tabs>
      <div data-anno="user-list-table">
        <SettingsListTable<InternalUser>
          actionRef={actionRef}
          rowKey="用户账号"
          columns={columns}
          searchFields={searchFields}
          searchClassName={`user-list-search ${settingsListSearch.className ?? ''}`}
          defaultSearchCollapsed={settingsListSearch.defaultCollapsed}
          tableBodyAnno="user-list-table-body"
          emptyNode={<SettingsListEmpty entityLabel="用户" filtered={listFiltered} />}
          toolbar={
            <span data-anno="user-list-toolbar">
              <Button type="primary" onClick={() => navigate('/settings/users/new')}>
                新增用户
              </Button>
            </span>
          }
          request={request}
        />
      </div>
      <DisableUserModal
        open={!!disableTarget}
        onCancel={() => setDisableTarget(null)}
        onConfirm={handleDisableConfirm}
      />
    </PageShell>
  )
}
