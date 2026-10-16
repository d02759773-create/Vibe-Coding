import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Button, Modal, Tabs, message } from 'antd'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EnableStatusTag } from '@/components/settings/EnableStatusTag'
import { ROLE_CODE_LABEL, ROLE_CODES, type EnableStatus, type RoleCode } from '@/features/settings/constants'
import { countUsersForRole, listRoles, nowString, saveRoles } from '@/features/settings/storage'
import type { RoleRecord } from '@/features/settings/types'

type StatusTab = 'all' | EnableStatus

export function RoleList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  const allRoles = useMemo(() => {
    void refreshKey
    return listRoles()
  }, [refreshKey])

  const tabCounts = useMemo(() => {
    const enabled = allRoles.filter((r) => r.启停用状态 === 'ENABLED').length
    const disabled = allRoles.filter((r) => r.启停用状态 === 'DISABLED').length
    return { all: allRoles.length, ENABLED: enabled, DISABLED: disabled }
  }, [allRoles])

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

  const columns: ProColumns<RoleRecord>[] = [
    {
      title: '角色编码',
      dataIndex: '角色编码',
      width: 160,
      fixed: 'left',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        ROLE_CODES.map((c) => [c, { text: `${c} ${ROLE_CODE_LABEL[c]}` }]),
      ),
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
      render: (_, row) => {
        const actions = [
          <a key="view" onClick={() => navigate(`/settings/roles/${row.角色编码}`)}>查看</a>,
          <a key="perm" onClick={() => navigate(`/settings/roles/${row.角色编码}/permissions`)}>
            配置权限
          </a>,
          <a key="edit" onClick={() => navigate(`/settings/roles/${row.角色编码}/edit`)}>编辑</a>,
        ]
        if (row.启停用状态 === 'ENABLED') {
          actions.push(<a key="off" onClick={() => toggleStatus(row, 'DISABLED')}>停用</a>)
        } else {
          actions.push(<a key="on" onClick={() => toggleStatus(row, 'ENABLED')}>启用</a>)
        }
        return actions
      },
    },
  ]

  return (
    <PageContainer
      title="内置角色"
      extra={
        <Button onClick={() => navigate('/settings/users')}>用户管理</Button>
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
      <ProTable<RoleRecord>
        actionRef={actionRef}
        rowKey="角色编码"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        pagination={false}
        options={false}
        request={async (params) => {
          let rows = [...allRoles]
          if (statusTab !== 'all') {
            rows = rows.filter((r) => r.启停用状态 === statusTab)
          }
          const code = params.角色编码 as RoleCode | undefined
          const name = String(params.角色名称 ?? '').trim().toLowerCase()
          const status = params.启停用状态 as EnableStatus | undefined
          if (code) rows = rows.filter((r) => r.角色编码 === code)
          if (name) rows = rows.filter((r) => r.角色名称.toLowerCase().includes(name))
          if (statusTab === 'all' && status) {
            rows = rows.filter((r) => r.启停用状态 === status)
          }
          return { data: rows, success: true, total: rows.length }
        }}
      />
    </PageContainer>
  )
}
