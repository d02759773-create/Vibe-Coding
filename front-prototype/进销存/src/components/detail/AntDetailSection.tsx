import { Card } from 'antd'
import { ProDescriptions, type ProDescriptionsItemProps } from '@ant-design/pro-components'

type AntDetailSectionProps<T extends Record<string, unknown>> = {
  title: string
  columns: ProDescriptionsItemProps<T>[]
  data: T
  column?: number | Record<string, number>
  anno?: string
}

export function AntDetailSection<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  column = { xs: 1, sm: 2, lg: 3 },
  anno,
}: AntDetailSectionProps<T>) {
  return (
    <Card title={title} size="small" data-anno={anno}>
      <ProDescriptions<T> column={column} columns={columns} dataSource={data} />
    </Card>
  )
}
