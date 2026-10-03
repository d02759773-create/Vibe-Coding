import { User } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold tracking-tight">进销存管理系统</h1>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="size-4" aria-hidden />
        <span>管理员（占位）</span>
      </div>
    </header>
  )
}
