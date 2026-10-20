import { Empty } from '@arco-design/web-react'

type Props = {
  entityLabel: string
  filtered: boolean
}

export function SettingsListEmpty({ entityLabel, filtered }: Props) {
  return (
    <Empty
      description={
        filtered
          ? `未找到符合条件的${entityLabel}，请调整筛选条件`
          : `暂无${entityLabel}`
      }
    />
  )
}
