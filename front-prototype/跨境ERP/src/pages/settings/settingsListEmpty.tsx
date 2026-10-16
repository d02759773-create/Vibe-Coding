import { Empty } from 'antd'

type Props = {
  entityLabel: string
  filtered: boolean
}

export function SettingsListEmpty({ entityLabel, filtered }: Props) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        filtered
          ? `未找到符合条件的${entityLabel}，请调整筛选条件`
          : `暂无${entityLabel}`
      }
    />
  )
}
