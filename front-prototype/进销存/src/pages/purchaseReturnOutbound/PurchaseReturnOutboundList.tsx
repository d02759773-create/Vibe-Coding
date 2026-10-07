import { useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Space, Tabs, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseReturnOutboundStatusTag } from '@/components/PurchaseReturnOutboundStatusTag'
import {
  RETURN_OUTBOUND_STATUS_FILTER_OPTIONS,
  RETURN_OUTBOUND_STATUS_TABS,
  formatYuan,
  partnerLabel,
  tabCountLabel,
} from '@/features/purchaseReturnOutbound/constants'
import {
  confirmPurchaseReturnOutbound,
  countReturnOutboundByTab,
  deletePurchaseReturnOutbound,
  filterPurchaseReturnOutbounds,
} from '@/features/purchaseReturnOutbound/storage'
import type {
  PurchaseReturnOutbound,
  PurchaseReturnOutboundListFilters,
  ReturnOutboundStatusTabKey,
} from '@/features/purchaseReturnOutbound/types'
import { confirmFailureToast, validateConfirm } from '@/features/purchaseReturnOutbound/validate'
import { formatDateTime } from '@/features/products/format'
import { listSuppliers } from '@/features/suppliers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: PurchaseReturnOutboundListFilters = {
  outboundNos: '',
  returnNos: '',
  inboundNos: '',
  supplierId: '',
  warehouseId: '',
  status: '',
  outboundDateFrom: '',
  outboundDateTo: '',
  updatedFrom: '',
  updatedTo: '',
}

function formatDateParam(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (
    typeof v === 'object' &&
    v !== null &&
    'format' in v &&
    typeof (v as { format: (f: string) => string }).format === 'function'
  ) {
    return (v as { format: (f: string) => string }).format('YYYY-MM-DD')
  }
  return String(v)
}

function paramsToFilters(params: Record<string, unknown>): PurchaseReturnOutboundListFilters {
  return {
    outboundNos: String(params.outboundNos ?? ''),
    returnNos: String(params.returnNos ?? ''),
    inboundNos: String(params.inboundNos ?? ''),
    supplierId: String(params.supplierId ?? ''),
    warehouseId: String(params.warehouseId ?? ''),
    status: (params.status ?? '') as PurchaseReturnOutboundListFilters['status'],
    outboundDateFrom: formatDateParam(params.outboundDateFrom),
    outboundDateTo: formatDateParam(params.outboundDateTo),
    updatedFrom: formatDateParam(params.updatedFrom),
    updatedTo: formatDateParam(params.updatedTo),
  }
}

export function PurchaseReturnOutboundList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<ReturnOutboundStatusTabKey>('ALL')
  const [applied, setApplied] = useState(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<PurchaseReturnOutbound | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)
  const [loading, setLoading] = useState(false)

  const suppliers = useMemo(() => listSuppliers(), [refreshKey])
  const warehouses = useMemo(() => listWarehouses(), [refreshKey])
  const tabCounts = useMemo(() => countReturnOutboundByTab(applied), [applied, refreshKey])

  const columns: ProColumns<PurchaseReturnOutbound>[] = [
    {
      title: '出库单号',
      dataIndex: 'outboundNo',
      fixed: 'left',
      width: 180,
      render: (_, row) => <Link to={`/purchase/return-outbound/${row.id}`}>{row.outboundNo}</Link>,
    },
    { title: '状态', hideInSearch: true, render: (_, r) => <PurchaseReturnOutboundStatusTag status={r.status} /> },
    {
      title: '关联退货单号',
      dataIndex: 'returnNo',
      render: (_, r) => <Link to={`/purchase/returns/${r.returnId}`}>{r.returnNo}</Link>,
    },
    {
      title: '关联入库单号',
      dataIndex: 'inboundNo',
      render: (_, r) => <Link to={`/purchase/inbound/${r.inboundId}`}>{r.inboundNo}</Link>,
    },
    {
      title: '供应商',
      dataIndex: 'supplierId',
      valueType: 'select',
      fieldProps: {
        options: suppliers.map((s) => ({ label: partnerLabel(s.supplierCode, s.supplierName), value: s.id })),
        showSearch: true,
        allowClear: true,
      },
      render: (_, r) => partnerLabel(r.supplierCode, r.supplierName),
    },
    {
      title: '出库仓库',
      dataIndex: 'warehouseId',
      valueType: 'select',
      fieldProps: {
        options: warehouses.map((w) => ({ label: partnerLabel(w.warehouseCode, w.warehouseName), value: w.id })),
        showSearch: true,
        allowClear: true,
      },
      render: (_, r) => partnerLabel(r.warehouseCode, r.warehouseName),
    },
    {
      title: '出库日期',
      dataIndex: 'outboundDate',
      valueType: 'dateRange',
      search: { transform: (v) => ({ outboundDateFrom: v?.[0], outboundDateTo: v?.[1] }) },
    },
    { title: '出库总数量', dataIndex: 'totalOutboundQty', hideInSearch: true },
    { title: '出库总金额', dataIndex: 'totalAmount', hideInSearch: true, render: (_, r) => formatYuan(r.totalAmount) },
    { title: '最后修改时间', dataIndex: 'updatedAt', hideInSearch: true, render: (_, r) => formatDateTime(r.updatedAt) },
    { title: '出库单号', dataIndex: 'outboundNos', hideInTable: true },
    { title: '关联退货单号', dataIndex: 'returnNos', hideInTable: true },
    { title: '关联入库单号', dataIndex: 'inboundNos', hideInTable: true },
    {
      title: '单据状态',
      dataIndex: 'status',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { options: RETURN_OUTBOUND_STATUS_FILTER_OPTIONS.map((o) => ({ label: o.label, value: o.value })) },
      hideInSearch: tab !== 'ALL',
    },
    {
      title: '操作',
      valueType: 'option',
      fixed: 'right',
      width: 200,
      render: (_, row) => {
        const items = [
          <Typography.Link key="v" style={tableActionLinkStyle} onClick={() => navigate(`/purchase/return-outbound/${row.id}`)}>
            查看
          </Typography.Link>,
        ]
        if (row.status === 'DRAFT') {
          items.push(
            <Typography.Link key="e" style={tableActionLinkStyle} onClick={() => navigate(`/purchase/return-outbound/${row.id}/edit`)}>
              编辑
            </Typography.Link>,
            <Typography.Link key="c" style={tableActionLinkStyle} onClick={() => { setConfirmRow(row); setConfirmKind('confirm') }}>
              确认出库
            </Typography.Link>,
            <Typography.Link key="d" style={tableActionLinkStyle} onClick={() => { setConfirmRow(row); setConfirmKind('delete') }}>
              删除
            </Typography.Link>,
          )
        }
        return <TableRowActions items={items} />
      },
    },
  ]

  async function runConfirm() {
    if (!confirmRow || !confirmKind) return
    setLoading(true)
    try {
      if (confirmKind === 'delete') {
        if (deletePurchaseReturnOutbound(confirmRow.id)) {
          setToast('已删除')
          setRefreshKey((k) => k + 1)
          actionRef.current?.reload()
        }
      } else {
        const err = validateConfirm(confirmRow)
        if (err) {
          setToast(confirmFailureToast(err))
          return
        }
        if (confirmPurchaseReturnOutbound(confirmRow.id)) {
          setToast('确认出库成功')
          setRefreshKey((k) => k + 1)
          actionRef.current?.reload()
        }
      }
      setConfirmRow(null)
      setConfirmKind(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="采购退货出库单" data-anno="purchase-return-outbound-list">
      <div data-anno="purchase-return-outbound-tabs">
        <Tabs
          activeKey={tab}
          onChange={(k) => {
            setTab(k as ReturnOutboundStatusTabKey)
            actionRef.current?.reload()
          }}
          items={RETURN_OUTBOUND_STATUS_TABS.map((t) => ({
            key: t.key,
            label: tabCountLabel(t.label, tabCounts[t.key]),
          }))}
          style={{ marginBottom: 16 }}
        />
      </div>
      <div data-anno="purchase-return-outbound-filters">
        <ProTable<PurchaseReturnOutbound>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          params={{ refreshKey, tab }}
          request={async (params) => {
            const f = paramsToFilters(params as Record<string, unknown>)
            setApplied(f)
            const data = filterPurchaseReturnOutbounds(f, tab)
            return { data, success: true, total: data.length }
          }}
          search={{ labelWidth: 'auto' }}
          cardProps={{ 'data-anno': 'purchase-return-outbound-table' } as HTMLAttributes<HTMLDivElement>}
          toolBarRender={() => [
            <Space key="tb" data-anno="purchase-return-outbound-list-toolbar">
              <Button key="n" type="primary" onClick={() => navigate('/purchase/return-outbound/new')}>新增</Button>
            </Space>,
          ]}
        />
      </div>
      <Modal
        open={Boolean(confirmRow && confirmKind)}
        title={confirmKind === 'delete' ? '确认删除' : '确认出库'}
        confirmLabel={confirmKind === 'delete' ? '删除' : '确认出库'}
        confirmVariant={confirmKind === 'delete' ? 'destructive' : 'default'}
        confirmDisabled={loading}
        onClose={() => { setConfirmRow(null); setConfirmKind(null) }}
        onConfirm={runConfirm}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {confirmKind === 'delete' ? '删除草稿出库单？' : '确认后将减少库存并回写退货单，是否继续？'}
        </Typography.Paragraph>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
