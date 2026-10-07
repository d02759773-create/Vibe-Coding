import { useMemo, useRef, useState } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Typography } from 'antd'
import { Button } from '@/components/ui/button'
import { BIZ_TYPE_LABEL, BIZ_TYPE_OPTIONS, partnerLabel } from '@/features/inventory/constants'
import { filterLedger } from '@/features/inventory/ledger'
import type { InventoryLedgerEntry, LedgerListFilters } from '@/features/inventory/types'
import { formatDateTime } from '@/features/products/format'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: LedgerListFilters = {
  bizTypes: '',
  docNos: '',
  warehouseId: '',
  productKeyword: '',
  occurredFrom: '',
  occurredTo: '',
}

function formatDateParam(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null && 'format' in v) {
    return (v as { format: (f: string) => string }).format('YYYY-MM-DD')
  }
  return String(v)
}

export function LedgerList() {
  const actionRef = useRef<ActionType>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const warehouses = useMemo(() => listWarehouses(), [refreshKey])

  const columns: ProColumns<InventoryLedgerEntry>[] = [
    {
      title: '发生时间',
      dataIndex: 'occurredAt',
      hideInSearch: true,
      render: (_, r) => formatDateTime(r.occurredAt),
    },
    {
      title: '业务类型',
      dataIndex: 'bizType',
      valueType: 'select',
      fieldProps: { options: BIZ_TYPE_OPTIONS, mode: 'multiple' },
      render: (_, r) => BIZ_TYPE_LABEL[r.bizType],
    },
    { title: '关联单号', dataIndex: 'docNo', hideInSearch: true },
    {
      title: '仓库',
      dataIndex: 'warehouseId',
      valueType: 'select',
      fieldProps: {
        options: warehouses.map((w) => ({ label: partnerLabel(w.warehouseCode, w.warehouseName), value: w.id })),
        allowClear: true,
      },
      render: (_, r) => partnerLabel(r.warehouseCode, r.warehouseName),
    },
    { title: '商品编码', dataIndex: 'productCode', hideInSearch: true },
    { title: '商品名称', dataIndex: 'productName', hideInSearch: true },
    {
      title: '变动数量',
      dataIndex: 'qtyDelta',
      hideInSearch: true,
      render: (_, r) => (
        <Typography.Text type={r.qtyDelta < 0 ? 'danger' : 'success'}>
          {r.qtyDelta > 0 ? `+${r.qtyDelta}` : r.qtyDelta}
        </Typography.Text>
      ),
    },
    { title: '操作人', dataIndex: 'operator', hideInSearch: true },
    { title: '单号', dataIndex: 'docNos', hideInTable: true },
    { title: '商品', dataIndex: 'productKeyword', hideInTable: true },
    {
      title: '发生日期',
      dataIndex: 'occurredAtRange',
      hideInTable: true,
      valueType: 'dateRange',
      search: { transform: (v) => ({ occurredFrom: v?.[0], occurredTo: v?.[1] }) },
    },
  ]

  return (
    <PageContainer title="库存流水查询" data-anno="inventory-ledger-list">
      <ProTable<InventoryLedgerEntry>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        params={{ refreshKey }}
        request={async (params) => {
          const biz = params.bizType
          const f: LedgerListFilters = {
            ...defaultFilters,
            warehouseId: String(params.warehouseId ?? ''),
            docNos: String(params.docNos ?? ''),
            productKeyword: String(params.productKeyword ?? ''),
            occurredFrom: formatDateParam(params.occurredFrom),
            occurredTo: formatDateParam(params.occurredTo),
            bizTypes: Array.isArray(biz) ? biz.join(',') : String(biz ?? ''),
          }
          const data = filterLedger(f)
          return { data, success: true, total: data.length }
        }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button key="r" type="button" variant="outline" onClick={() => { setRefreshKey((k) => k + 1); actionRef.current?.reload() }}>
            刷新
          </Button>,
        ]}
      />
    </PageContainer>
  )
}
