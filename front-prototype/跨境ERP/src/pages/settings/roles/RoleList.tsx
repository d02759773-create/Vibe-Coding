import { Button, Message, Modal, Tabs } from '@arco-design/web-react'
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
import { countUsersForRole, listRoles, nowString, saveRoles } from '@/features/settings/storage'
import type { RoleRecord } from '@/features/settings/types'
import { settingsListSearch } from '@/pages/settings/proTableSearch'
import { tabCountLabel } from '@/pages/settings/tabCountLabel'
import { SettingsListEmpty } from '@/pages/settings/settingsListEmpty'
import { withSettingsListLoading } from '@/pages/settings/settingsListFetch'
import { filterRoleListRows, roleListHasFilters } from '@/pages/settings/roles/filterRoleList'
import { TableRowActions, tableActionLink } from '@/pages/settings/tableActions'

type StatusTab = 'all' | EnableStatus

export function RoleList() {
  const navigate = useNavigate()
  const actionRef = useRef<SettingsListTableAction>(null)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [listFiltered, setListFiltered] = useState(false)

  const allRoles = useMemo(() => {
    void refreshKey
    return listRoles()
  }, [refreshKey])

  const tabCounts = useMemo(() => {
    const enabled = allRoles.filter((r) => r.启停用状态 === 'ENABLED').length
    const disabled = allRoles.filter((r) => r.启停用状态 === 'DISABLED').length
    return { all: allRoles.length, ENABLED: enabled, DISABLED: disabled }
  }, [allRoles])

  const roleCodeOptions = useMemo(
    () =>
      allRoles.map((r) => ({
        label: `${r.角色编码} ${r.角色名称}`,
        value: r.角色编码,
      })),
    [allRoles],
  )

  const toggleStatus = (row: RoleRecord, next: EnableStatus) => {
    Modal.confirm({
      title: next === 'DISABLED' ? '停用角色' : '启用角色',
      content: next === 'DISABLED' ? '确认停用该角色？' : '确认启用该角色？',
      onOk: () => {
        const roles = listRoles().map((r) =>
          r.角色编码 === row.角色编码
            ? { ...r, 启停用状态: next, 最后修改时间: nowString() }
            : r,
        )
        saveRoles(roles)
        Message.success(next === 'DISABLED' ? '角色已停用' : '已启用')
        setRefreshKey((k) => k + 1)
        actionRef.current?.reload()
      },
    })
  }

  const searchFields: SettingsSearchField[] = useMemo(
    () => [
      { name: '角色编码', label: '角色编码', type: 'select', options: roleCodeOptions },
      { name: '角色名称', label: '角色名称', type: 'text' },
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
    ],
    [roleCodeOptions, statusTab],
  )

  const columns: ColumnProps<RoleRecord>[] = useMemo(
    () => [
      {
        title: '角色编码',
        dataIndex: '角色编码',
        width: 160,
        fixed: 'left',
        render: (_, row) => <Link to={`/settings/roles/${row.角色编码}`}>{row.角色编码}</Link>,
      },
      { title: '角色名称', dataIndex: '角色名称', width: 140 },
      {
        title: '关联用户数',
        width: 100,
        render: (_, row) => countUsersForRole(row.角色编码),
      },
      {
        title: '启停用状态',
        dataIndex: '启停用状态',
        width: 90,
        render: (_, row) => <EnableStatusTag status={row.启停用状态} />,
      },
      {
        title: '操作',
        width: 220,
        fixed: 'right',
        render: (_, row) => (
          <TableRowActions
            items={[
              tableActionLink('查看', () => navigate(`/settings/roles/${row.角色编码}`)),
              tableActionLink('配置权限', () =>
                navigate(`/settings/roles/${row.角色编码}/permissions`),
              ),
              tableActionLink('编辑', () => navigate(`/settings/roles/${row.角色编码}/edit`)),
              row.启停用状态 === 'ENABLED'
                ? tableActionLink('停用', () => toggleStatus(row, 'DISABLED'))
                : tableActionLink('启用', () => toggleStatus(row, 'ENABLED')),
            ]}
          />
        ),
      },
    ],
    [navigate],
  )

  const request = useMemo(
    () => async (params: Record<string, unknown>) => {
      setListFiltered(roleListHasFilters(params))
      const loaded = await withSettingsListLoading(() =>
        filterRoleListRows(allRoles, statusTab, params),
      )
      if (!loaded.ok) {
        Message.error('加载失败，请重试')
        return { data: [], success: false, total: 0 }
      }
      const rows = loaded.value
      return { data: rows, success: true, total: rows.length }
    },
    [allRoles, statusTab],
  )

  return (
    <PageShell title="角色管理" subTitle="维护角色档案、菜单可见性与启停用">
      <Tabs
        data-anno="role-list-tabs"
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
      <div data-anno="role-list-table">
        <SettingsListTable<RoleRecord>
          actionRef={actionRef}
          rowKey="角色编码"
          columns={columns}
          searchFields={searchFields}
          searchClassName={`role-list-search ${settingsListSearch.className ?? ''}`}
          defaultSearchCollapsed={settingsListSearch.defaultCollapsed}
          tableBodyAnno="role-list-table-body"
          emptyNode={<SettingsListEmpty entityLabel="角色" filtered={listFiltered} />}
          toolbar={
            <span data-anno="role-list-toolbar">
              <Button type="primary" onClick={() => navigate('/settings/roles/new')}>
                新增角色
              </Button>
            </span>
          }
          request={request}
        />
      </div>
    </PageShell>
  )
}
