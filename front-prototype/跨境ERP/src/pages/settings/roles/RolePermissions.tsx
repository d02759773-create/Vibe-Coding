import { Button, Card, Message, Space, Switch, Table } from '@arco-design/web-react'
import type { ColumnProps } from '@arco-design/web-react/es/Table'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import type { MenuVisibility, RoleCode } from '@/features/settings/constants'
import {
  getRole,
  getRolePermissionRows,
  listRolePermissions,
  saveRolePermissions,
} from '@/features/settings/storage'
import { confirmUnsavedNavigate } from '@/pages/settings/confirmUnsavedLeave'
import { useUnsavedLeaveBlocker } from '@/pages/settings/useUnsavedLeaveBlocker'

type PermRow = ReturnType<typeof getRolePermissionRows>[number]

function sortPermRows(rows: PermRow[]): PermRow[] {
  return [...rows].sort(
    (a, b) =>
      a.一级菜单名称.localeCompare(b.一级菜单名称, 'zh-CN') ||
      a.二级菜单名称.localeCompare(b.二级菜单名称, 'zh-CN'),
  )
}

function primaryMenuRowSpans(sorted: PermRow[]): number[] {
  const spans = new Array<number>(sorted.length).fill(1)
  let i = 0
  while (i < sorted.length) {
    const name = sorted[i].一级菜单名称
    let j = i + 1
    while (j < sorted.length && sorted[j].一级菜单名称 === name) j++
    spans[i] = j - i
    for (let k = i + 1; k < j; k++) spans[k] = 0
    i = j
  }
  return spans
}

const VISIBILITY_COL_WIDTH = 140

function permissionSnapshot(rows: PermRow[]): string {
  return JSON.stringify(
    rows
      .map((r) => ({ c: r.二级菜单编码, v: r.菜单可见性 }))
      .sort((a, b) => a.c.localeCompare(b.c)),
  )
}

export function RolePermissions() {
  const { roleCode } = useParams()
  const navigate = useNavigate()
  const code = roleCode as RoleCode
  const role = getRole(code)

  const initial = useMemo(() => getRolePermissionRows(code), [code])
  const [rows, setRows] = useState(initial)
  const [saving, setSaving] = useState(false)
  const savedSnapshot = useRef(permissionSnapshot(initial))
  const leaveDirty = permissionSnapshot(rows) !== savedSnapshot.current
  const detailPath = `/settings/roles/${code}`
  const { allowLeaveOnce } = useUnsavedLeaveBlocker(leaveDirty)
  const goRoleDetail = () =>
    confirmUnsavedNavigate(leaveDirty, () => {
      allowLeaveOnce()
      navigate(detailPath)
    })

  const sortedRows = useMemo(() => sortPermRows(rows), [rows])
  const rowSpans = useMemo(() => primaryMenuRowSpans(sortedRows), [sortedRows])

  const columns: ColumnProps<PermRow>[] = useMemo(
    () => [
      {
        title: '一级菜单',
        dataIndex: '一级菜单名称',
        width: 112,
        render: (col, _record, index) => ({
          children: col,
          props: { rowSpan: rowSpans[index ?? 0] ?? 1 },
        }),
      },
      {
        title: '二级菜单',
        dataIndex: '二级菜单名称',
        ellipsis: true,
      },
      {
        title: '菜单可见性',
        width: VISIBILITY_COL_WIDTH,
        align: 'center',
        render: (_, row) => (
          <Switch
            checked={row.菜单可见性 === 'VISIBLE'}
            checkedText="可见"
            uncheckedText="不可见"
            onChange={(checked) => {
              const vis: MenuVisibility = checked ? 'VISIBLE' : 'HIDDEN'
              setRows((prev) =>
                prev.map((r) =>
                  r.二级菜单编码 === row.二级菜单编码 ? { ...r, 菜单可见性: vis } : r,
                ),
              )
            }}
          />
        ),
      },
    ],
    [rowSpans],
  )

  if (!role) {
    return (
      <PageShell title="角色不存在">
        <Button onClick={() => navigate('/settings/roles')}>返回列表</Button>
      </PageShell>
    )
  }

  const save = () => {
    setSaving(true)
    try {
      const all = listRolePermissions()
      all[code] = rows.map((r) => ({
        二级菜单编码: r.二级菜单编码,
        菜单可见性: r.菜单可见性,
      }))
      saveRolePermissions(all)
      savedSnapshot.current = permissionSnapshot(rows)
      Message.success('权限已保存')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      title="配置角色权限"
      subTitle={`${role.角色编码} ${role.角色名称}`}
      onBack={goRoleDetail}
      extra={
        <div style={{ position: 'relative' }}>
          <span
            data-anno="role-permissions-actions"
            aria-hidden
            style={{
              position: 'absolute',
              right: 0,
              bottom: '100%',
              marginBottom: 4,
              width: 40,
              height: 12,
              pointerEvents: 'none',
            }}
          />
          <Space style={{ position: 'relative', zIndex: 2 }}>
            <Button type="default" onClick={goRoleDetail}>返回</Button>
            <Button type="primary" loading={saving} onClick={save}>保存</Button>
          </Space>
        </div>
      }
    >
      <Card size="small" data-anno="role-permissions-table">
        <Table<PermRow>
          size="small"
          pagination={false}
          rowKey="二级菜单编码"
          data={sortedRows}
          columns={columns}
        />
      </Card>
      <p style={{ color: 'var(--color-text-3)', marginTop: 16 }}>
        保存后立即生效（刷新菜单或重新拉取权限）。
      </p>
    </PageShell>
  )
}
