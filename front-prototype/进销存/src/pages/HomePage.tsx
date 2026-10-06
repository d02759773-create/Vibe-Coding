import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

const HomeAgentPage = lazy(() =>
  import('@/features/homeAgent/components/HomeAgentPage').then((m) => ({
    default: m.HomeAgentPage,
  })),
)

export function HomePage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin tip="加载 AI 工作台…" />
        </div>
      }
    >
      <div className="home-agent-page-shell">
        <HomeAgentPage />
      </div>
    </Suspense>
  )
}
