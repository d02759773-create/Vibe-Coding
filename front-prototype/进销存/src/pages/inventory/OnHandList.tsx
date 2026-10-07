import { useMemo, useRef, useState } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Button } from '@/components/ui/button'
import { partnerLabel } from '@/features/inventory/constants'
import { filterOnHand } from '@/features/inventory/onHand'
import type { OnHandListFilters, OnHandRow } from '@/features/inventory/types'
import { listWarehouses } from '@/features/warehouses/storage'

export function OnHandList() {
  const actionRef = useRef<ActionType>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const warehouses = useMemo(() => listWarehouses(), [refreshKey])

  const columns: ProColumns<OnHandRow>[] = [
    {
      title: '仓库',
      dataIndex: 'warehouseId',
      valueType: 'select',
      fieldProps: {
        options: warehouses.map((w) => ({ label: partnerLabel(w.warehouseCode, w.warehouseName), value: w.id })),
        allowClear: true,
        showSearch: true,
      },
      render: (_, r) => partnerLabel(r.warehouseCode, r.warehouseName),
    },
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '规格型号', dataIndex: 'specModel' },
    { title: '单位', dataIndex: 'unit', hideInSearch: true },
    { title: '即时库存', dataIndex: 'qtyOnHand', hideInSearch: true },
    { title: '商品', dataIndex: 'productKeyword', hideInTable: true },
  ]

  return (
    <PageContainer title="即时库存查询" data-anno="inventory-on-hand-list">
      <ProTable<OnHandRow>
        actionRef={actionRef}
        rowKey={(r) => `${r.warehouseId}-${r.productId}`}
        columns={columns}
        params={{ refreshKey }}
        request={async (params) => {
          void refreshKey
          const f: OnHandListFilters = {
            warehouseId: String(params.warehouseId ?? ''),
            productKeyword: String(params.productKeyword ?? ''),
          }
          const data = filterOnHand(f)
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
