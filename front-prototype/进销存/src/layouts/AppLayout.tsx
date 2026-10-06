import { ProLayout } from '@ant-design/pro-components'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { proLayoutRoute } from '@/config/proLayoutMenu'

export function AppLayout() {
  const location = useLocation()
  const isHomeAgent = location.pathname === '/'

  return (
    <ProLayout
      title="进销存管理系统"
      layout="mix"
      fixSiderbar
      location={{ pathname: location.pathname }}
      route={proLayoutRoute}
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
        title: '管理员（占位）',
        size: 'small',
      }}
      className={isHomeAgent ? 'app-layout--agent-home' : undefined}
      contentStyle={
        isHomeAgent
          ? { padding: 0, margin: 0, height: 'calc(100vh - 56px)', overflow: 'hidden' }
          : { padding: 24 }
      }
    >
      <Outlet />
    </ProLayout>
  )
}
