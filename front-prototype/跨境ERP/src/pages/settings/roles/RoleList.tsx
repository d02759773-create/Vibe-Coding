import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Button, Modal, Skeleton, Tabs, message } from 'antd'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const actionRef = useRef<ActionType>(undefined)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [tableLoading, setTableLoading] = useState(true)
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

  const roleCodeFilterEnum = useMemo(
    () =>
      Object.fromEntries(
        allRoles.map((r) => [r.角色编码, { text: `${r.角色编码} ${r.角色名称}` }]),
      ),
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
        message.success(next === 'DISABLED' ? '角色已停用' : '已启用')
        setRefreshKey((k) => k + 1)
        actionRef.current?.reload()
      },
    })
  }

  const columns: ProColumns<RoleRecord>[] = useMemo(
    () => [
      {
        title: '角色编码',
        dataIndex: '角色编码',
        width: 160,
        fixed: 'left',
        valueType: 'select',
        valueEnum: roleCodeFilterEnum,
        render: (_, row) => <Link to={`/settings/roles/${row.角色编码}`}>{row.角色编码}</Link>,
      },
      { title: '角色名称', dataIndex: '角色名称', width: 140 },
      {
        title: '关联用户数',
        dataIndex: '关联用户数',
        width: 100,
        search: false,
        render: (_, row) => countUsersForRole(row.角色编码),
      },
      {
        title: '启停用状态',
        dataIndex: '启停用状态',
        width: 90,
        search: statusTab === 'all' ? undefined : false,
        valueType: 'select',
        valueEnum: { ENABLED: { text: '启用' }, DISABLED: { text: '停用' } },
        render: (_, row) => <EnableStatusTag status={row.启停用状态} />,
      },
      {
        title: '操作',
        valueType: 'option',
        width: 220,
        fixed: 'right',
        search: false,
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
    [navigate, roleCodeFilterEnum, statusTab],
  )

  return (
    <PageContainer title="角色管理" subTitle="维护角色档案、菜单可见性与启停用">
      <Tabs
        data-anno="role-list-tabs"
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
      <div data-anno="role-list-table">
      <ProTable<RoleRecord>
        actionRef={actionRef}
        rowKey="角色编码"
        columns={columns}
        search={{ ...settingsListSearch, className: 'role-list-search' }}
        locale={{
          emptyText: <SettingsListEmpty entityLabel="角色" filtered={listFiltered} />,
        }}
        tableRender={(_, dom) =>
          tableLoading ? (
            <div style={{ padding: 24, background: '#fff' }}>
              <Skeleton active paragraph={{ rows: 12 }} title={false} />
            </div>
          ) : (
            <div data-anno="role-list-table-body">{dom}</div>
          )
        }
        toolBarRender={() => [
          <span key="new" data-anno="role-list-toolbar">
            <Button type="primary" onClick={() => navigate('/settings/roles/new')}>
              新增角色
            </Button>
          </span>,
        ]}
        pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
        options={false}
        request={async (params) => {
          setTableLoading(true)
          try {
            setListFiltered(roleListHasFilters(params))
            const loaded = await withSettingsListLoading(() =>
              filterRoleListRows(allRoles, statusTab, params),
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
    </PageContainer>
  )
}
