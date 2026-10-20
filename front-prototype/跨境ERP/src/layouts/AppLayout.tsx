import { Avatar, Layout, Menu, Typography } from '@arco-design/web-react'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  defaultOpenMenuKeys,
  sidebarMenuNodes,
  type ArcoMenuNode,
} from '@/config/arcoMenu'

const { Sider, Header, Content } = Layout

function renderMenuNodes(nodes: ArcoMenuNode[]) {
  return nodes.map((node) => {
    if (node.type === 'sub') {
      return (
        <Menu.SubMenu key={node.key} title={node.title}>
          {renderMenuNodes(node.children)}
        </Menu.SubMenu>
      )
    }
    return <Menu.Item key={node.key}>{node.title}</Menu.Item>
  })
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const defaultOpenKeys = useMemo(() => defaultOpenMenuKeys(), [])

  const selectedKey = location.pathname === '/' ? '/' : location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        breakpoint="lg"
        style={{ height: '100vh', position: 'sticky', top: 0 }}
      >
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            color: 'var(--color-white)',
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          跨境电商 ERP
        </div>
        <Menu
          selectedKeys={[selectedKey]}
          defaultOpenKeys={defaultOpenKeys}
          style={{ width: '100%' }}
          onClickMenuItem={(key) => {
            navigate(key)
          }}
        >
          {renderMenuNodes(sidebarMenuNodes)}
        </Menu>
      </Sider>
      <Layout>
        <Header
          style={{
            height: 48,
            background: 'var(--color-bg-2)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 24px',
          }}
        >
          <Avatar size={28} style={{ marginRight: 8 }}>U</Avatar>
          <Typography.Text>内部用户（演示）</Typography.Text>
        </Header>
        <Content style={{ padding: 24, background: 'var(--color-fill-2)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
