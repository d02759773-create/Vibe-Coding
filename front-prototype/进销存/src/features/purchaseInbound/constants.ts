import type { InboundDiffReason, PurchaseInboundStatus, InboundStatusTabKey } from './types'

export const INBOUND_STATUS_TABS: { key: InboundStatusTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'STOCKED_IN', label: '已入库' },
]

export const INBOUND_STATUS_LABEL: Record<PurchaseInboundStatus, string> = {
  DRAFT: '草稿',
  STOCKED_IN: '已入库',
  VOIDED: '已作废',
}

export const INBOUND_STATUS_FILTER_OPTIONS: { label: string; value: '' | PurchaseInboundStatus }[] = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已入库', value: 'STOCKED_IN' },
]

export const DIFF_REASON_OPTIONS: { label: string; value: InboundDiffReason }[] = [
  { label: '请选择', value: '' },
  { label: '运输破损', value: '运输破损' },
  { label: '质量问题', value: '质量问题' },
  { label: '短少待补', value: '短少待补' },
  { label: '其他', value: '其他' },
]

export { formatYuan, partnerLabel, todayDateString, tabCountLabel } from '@/features/purchaseOrders/constants'
