import { Button, Space, Tabs, Typography } from 'antd'
import { useMemo, useState } from 'react'

type Props = { code: string }

export function HtmlArtifact({ code }: Props) {
  const [tab, setTab] = useState('preview')
  const srcDoc = useMemo(() => code, [code])

  const download = () => {
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Tabs
      size="small"
      activeKey={tab}
      onChange={setTab}
      tabBarExtraContent={
        <Space size="small">
          <Button size="small" onClick={download}>导出 HTML</Button>
        </Space>
      }
      items={[
        {
          key: 'preview',
          label: '预览',
          children: (
            <iframe
              title="html-report"
              sandbox=""
              srcDoc={srcDoc}
              style={{ width: '100%', height: 360, border: '1px solid #f0f0f0', borderRadius: 8 }}
            />
          ),
        },
        {
          key: 'source',
          label: '源码',
          children: (
            <Typography.Paragraph copyable style={{ margin: 0 }}>
              <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{code}</pre>
            </Typography.Paragraph>
          ),
        },
      ]}
    />
  )
}
