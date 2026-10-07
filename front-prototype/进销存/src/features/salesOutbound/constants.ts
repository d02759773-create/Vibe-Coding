import type { InboundDiffReason, SalesOutboundStatus, OutboundStatusTabKey } from './types'

export const INBOUND_STATUS_TABS: { key: OutboundStatusTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'SHIPPED', label: '已出库' },
]

export const INBOUND_STATUS_LABEL: Record<SalesOutboundStatus, string> = {
  DRAFT: '草稿',
  SHIPPED: '已出库',
  VOIDED: '已作废',
}

export const INBOUND_STATUS_FILTER_OPTIONS: { label: string; value: '' | SalesOutboundStatus }[] = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已出库', value: 'SHIPPED' },
]

export const OUTBOUND_STATUS_LABEL = INBOUND_STATUS_LABEL

export const DIFF_REASON_OPTIONS: { label: string; value: InboundDiffReason }[] = [
  { label: '请选择', value: '' },
  { label: '运输破损', value: '运输破损' },
  { label: '质量问题', value: '质量问题' },
  { label: '短少待补', value: '短少待补' },
  { label: '其他', value: '其他' },
]

export { formatYuan, partnerLabel, todayDateString, tabCountLabel } from '@/features/purchaseOrders/constants'
