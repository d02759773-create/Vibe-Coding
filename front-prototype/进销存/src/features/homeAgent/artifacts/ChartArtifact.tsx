import ReactECharts from 'echarts-for-react'
import { Alert, Tabs, Typography } from 'antd'
import { useMemo, useState } from 'react'

type Props = { code: string }

export function ChartArtifact({ code }: Props) {
  const [tab, setTab] = useState('preview')
  const parsed = useMemo(() => {
    try {
      return { option: JSON.parse(code) as object, error: null as string | null }
    } catch (e) {
      return { option: null, error: e instanceof Error ? e.message : 'JSON 解析失败' }
    }
  }, [code])

  if (parsed.error || !parsed.option) {
    return <Alert type="error" message="图表配置无效" description={parsed.error} showIcon />
  }

  return (
    <Tabs
      className="ha-chart-tabs"
      size="small"
      activeKey={tab}
      onChange={setTab}
      items={[
        {
          key: 'preview',
          label: '预览',
          children: <ReactECharts option={parsed.option} style={{ height: 320 }} notMerge lazyUpdate />,
        },
        {
          key: 'source',
          label: '源码',
          children: (
            <Typography.Paragraph copyable style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
              <pre style={{ margin: 0 }}>{code}</pre>
            </Typography.Paragraph>
          ),
        },
      ]}
    />
  )
}
