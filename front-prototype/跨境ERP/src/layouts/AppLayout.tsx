import { ProLayout } from '@ant-design/pro-components'
import { useMemo } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { navigation } from '@/config/navigation'
import { proLayoutRoute } from '@/config/proLayoutMenu'

function sidebarGroupKey(children: { path?: string }[]): string {
  const first = children.find((c) => c.path)?.path
  if (!first) return '/'
  const parts = first.split('/').filter(Boolean)
  return parts.length >= 1 ? `/${parts[0]}` : '/'
}

export function AppLayout() {
  const location = useLocation()
  const defaultOpenKeys = useMemo(
    () =>
      navigation
        .filter((item) => item.children?.length)
        .map((item) => sidebarGroupKey(item.children!)),
    [],
  )

  return (
    <ProLayout
      title="跨境电商 ERP"
      layout="mix"
      fixSiderbar
      location={{ pathname: location.pathname }}
      route={proLayoutRoute}
      menuProps={{
        defaultOpenKeys,
      }}
      menuItemRender={(item, dom) => {
        if (!item.path || item.path === '/') {
          return (
            <Link to="/" style={{ color: 'inherit' }}>
              {dom}
            </Link>
          )
        }
        return (
          <Link to={item.path} style={{ color: 'inherit' }}>
            {dom}
          </Link>
        )
      }}
      avatarProps={{
        title: '内部用户（演示）',
        size: 'small',
      }}
      contentStyle={{ padding: 24 }}
    >
      <Outlet />
    </ProLayout>
  )
}
