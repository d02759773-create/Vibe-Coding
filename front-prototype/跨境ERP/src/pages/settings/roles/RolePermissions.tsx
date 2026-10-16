import { PageContainer } from '@ant-design/pro-components'
import { Button, Card, Space, Switch, Table, message } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { MenuVisibility, RoleCode } from '@/features/settings/constants'
import {
  getRole,
  getRolePermissionRows,
  listRolePermissions,
  saveRolePermissions,
} from '@/features/settings/storage'

export function RolePermissions() {
  const { roleCode } = useParams()
  const navigate = useNavigate()
  const code = roleCode as RoleCode
  const role = getRole(code)

  const initial = useMemo(() => getRolePermissionRows(code), [code])
  const [rows, setRows] = useState(initial)

  if (!role) {
    return (
      <PageContainer title="角色不存在">
        <Button onClick={() => navigate('/settings/roles')}>返回列表</Button>
      </PageContainer>
    )
  }

  const save = () => {
    const all = listRolePermissions()
    all[code] = rows.map((r) => ({
      二级菜单编码: r.二级菜单编码,
      菜单可见性: r.菜单可见性,
    }))
    saveRolePermissions(all)
    message.success('权限已保存')
  }

  const grouped = useMemo(() => {
    const map = new Map<string, typeof rows>()
    for (const row of rows) {
      const key = row.一级菜单名称
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return map
  }, [rows])

  return (
    <PageContainer
      title="配置角色权限"
      subTitle={`${role.角色编码} ${role.角色名称}`}
      onBack={() => navigate(`/settings/roles/${code}`)}
      extra={
        <Space>
          <Button onClick={() => navigate(`/settings/roles/${code}`)}>返回</Button>
          <Button type="primary" onClick={save}>保存</Button>
        </Space>
      }
    >
      {[...grouped.entries()].map(([l1Name, groupRows]) => (
        <Card key={l1Name} title={l1Name} size="small" style={{ marginBottom: 16 }}>
          <Table
            size="small"
            pagination={false}
            rowKey="二级菜单编码"
            dataSource={groupRows}
            columns={[
              { title: '二级菜单', dataIndex: '二级菜单名称' },
              {
                title: '菜单可见性',
                render: (_, row) => (
                  <Switch
                    checked={row.菜单可见性 === 'VISIBLE'}
                    checkedChildren="可见"
                    unCheckedChildren="不可见"
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
            ]}
          />
        </Card>
      ))}
      <p style={{ color: 'rgba(0,0,0,0.45)' }}>保存后立即生效（刷新菜单或重新拉取权限）。</p>
    </PageContainer>
  )
}
