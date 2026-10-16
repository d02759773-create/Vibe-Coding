import { createHashRouter } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { routeMetaList } from '@/config/routes'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { WorkbenchPage } from '@/pages/WorkbenchPage'
import { RoleDetail } from '@/pages/settings/roles/RoleDetail'
import { RoleForm } from '@/pages/settings/roles/RoleForm'
import { RoleList } from '@/pages/settings/roles/RoleList'
import { RolePermissions } from '@/pages/settings/roles/RolePermissions'
import { UserDetail } from '@/pages/settings/users/UserDetail'
import { UserForm } from '@/pages/settings/users/UserForm'
import { UserList } from '@/pages/settings/users/UserList'

const settingsRoutes = [
  { path: 'settings/users', element: <UserList /> },
  { path: 'settings/users/new', element: <UserForm /> },
  { path: 'settings/users/:account/edit', element: <UserForm /> },
  { path: 'settings/users/:account', element: <UserDetail /> },
  { path: 'settings/roles', element: <RoleList /> },
  { path: 'settings/roles/:roleCode/permissions', element: <RolePermissions /> },
  { path: 'settings/roles/:roleCode/edit', element: <RoleForm /> },
  { path: 'settings/roles/:roleCode', element: <RoleDetail /> },
]

const settingsPathPrefixes = ['/settings/users', '/settings/roles']

function isSettingsRoute(path: string): boolean {
  return settingsPathPrefixes.some((p) => path === p || path.startsWith(`${p}/`))
}

const leafRoutes = routeMetaList
  .filter((r) => r.path !== '/' && !isSettingsRoute(r.path))
  .map((r) => ({
    path: r.path.replace(/^\//, ''),
    element: <PlaceholderPage />,
  }))

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <WorkbenchPage /> },
      ...settingsRoutes,
      ...leafRoutes,
      { path: '*', element: <PlaceholderPage /> },
    ],
  },
])
