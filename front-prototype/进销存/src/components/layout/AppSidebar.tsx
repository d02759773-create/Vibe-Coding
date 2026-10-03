import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { type NavItem, navigation } from '@/config/navigation'
import { cn } from '@/lib/utils'

function isGroupActive(item: NavItem, pathname: string) {
  return item.children?.some(
    (child) => child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`)),
  )
}

function NavGroup({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  const active = isGroupActive(item, pathname)
  const [open, setOpen] = useState(active)

  if (!item.children?.length) return null

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between px-3 font-medium"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{item.title}</span>
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </Button>
      {open && (
        <div className="space-y-0.5 pl-2">
          {item.children.map((child) =>
            child.path ? (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent font-medium text-accent-foreground',
                  )
                }
              >
                {child.title}
              </NavLink>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/30">
      <div className="border-b px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          导航菜单
        </p>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto p-3">
        {navigation.map((item) =>
          item.path ? (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {item.title}
            </NavLink>
          ) : (
            <NavGroup key={item.title} item={item} />
          ),
        )}
      </nav>
    </aside>
  )
}
