import { useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Space, Tabs, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { SalesReturnInboundStatusTag } from '@/components/SalesReturnInboundStatusTag'
import {
  RETURN_OUTBOUND_STATUS_FILTER_OPTIONS,
  RETURN_OUTBOUND_STATUS_TABS,
  formatYuan,
  partnerLabel,
  tabCountLabel,
} from '@/features/salesReturnInbound/constants'
import {
  confirmSalesReturnInbound,
  countReturnInboundByTab,
  deleteSalesReturnInbound,
  filterSalesReturnInbounds,
} from '@/features/salesReturnInbound/storage'
import type {
  SalesReturnInbound,
  SalesReturnInboundListFilters,
  ReturnInboundStatusTabKey,
} from '@/features/salesReturnInbound/types'
import { confirmFailureToast, validateConfirm } from '@/features/salesReturnInbound/validate'
import { formatDateTime } from '@/features/products/format'
import { listCustomers } from '@/features/customers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: SalesReturnInboundListFilters = {
  outboundNos: '',
  returnNos: '',
  inboundNos: '',
  customerId: '',
  warehouseId: '',
  status: '',
  inboundDateFrom: '',
  inboundDateTo: '',
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

function paramsToFilters(params: Record<string, unknown>): SalesReturnInboundListFilters {
  return {
    outboundNos: String(params.outboundNos ?? ''),
    returnNos: String(params.returnNos ?? ''),
    inboundNos: String(params.inboundNos ?? ''),
    customerId: String(params.customerId ?? ''),
    warehouseId: String(params.warehouseId ?? ''),
    status: (params.status ?? '') as SalesReturnInboundListFilters['status'],
    inboundDateFrom: formatDateParam(params.inboundDateFrom),
    inboundDateTo: formatDateParam(params.inboundDateTo),
    updatedFrom: formatDateParam(params.updatedFrom),
    updatedTo: formatDateParam(params.updatedTo),
  }
}

export function SalesReturnInboundList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<ReturnInboundStatusTabKey>('ALL')
  const [applied, setApplied] = useState(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<SalesReturnInbound | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)
  const [loading, setLoading] = useState(false)

  const suppliers = useMemo(() => listCustomers(), [refreshKey])
  const warehouses = useMemo(() => listWarehouses(), [refreshKey])
  const tabCounts = useMemo(() => countReturnInboundByTab(applied), [applied, refreshKey])

  const columns: ProColumns<SalesReturnInbound>[] = [
    {
      title: '入库单号',
      dataIndex: 'inboundNo',
      fixed: 'left',
      width: 180,
      render: (_, row) => <Link to={`/sales/return-inbound/${row.id}`}>{row.inboundNo}</Link>,
    },
    { title: '状态', hideInSearch: true, render: (_, r) => <SalesReturnInboundStatusTag status={r.status} /> },
    {
      title: '关联退货单号',
      dataIndex: 'returnNo',
      render: (_, r) => <Link to={`/sales/returns/${r.returnId}`}>{r.returnNo}</Link>,
    },
    {
      title: '关联出库单号',
      dataIndex: 'outboundNo',
      render: (_, r) => <Link to={`/sales/outbound/${r.outboundId}`}>{r.outboundNo}</Link>,
    },
    {
      title: '客户',
      dataIndex: 'customerId',
      valueType: 'select',
      fieldProps: {
        options: suppliers.map((s) => ({ label: partnerLabel(s.customerCode, s.customerName), value: s.id })),
        showSearch: true,
        allowClear: true,
      },
      render: (_, r) => partnerLabel(r.customerCode, r.customerName),
    },
    {
      title: '入库仓库',
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
      title: '入库日期',
      dataIndex: 'inboundDate',
      valueType: 'dateRange',
      search: { transform: (v) => ({ inboundDateFrom: v?.[0], inboundDateTo: v?.[1] }) },
    },
    { title: '入库总数量', dataIndex: 'totalInboundQty', hideInSearch: true },
    { title: '入库总金额', dataIndex: 'totalAmount', hideInSearch: true, render: (_, r) => formatYuan(r.totalAmount) },
    { title: '最后修改时间', dataIndex: 'updatedAt', hideInSearch: true, render: (_, r) => formatDateTime(r.updatedAt) },
    { title: '入库单号', dataIndex: 'inboundNos', hideInTable: true },
    { title: '关联退货单号', dataIndex: 'returnNos', hideInTable: true },
    { title: '关联出库单号', dataIndex: 'outboundNos', hideInTable: true },
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
          <Typography.Link key="v" style={tableActionLinkStyle} onClick={() => navigate(`/sales/return-inbound/${row.id}`)}>
            查看
          </Typography.Link>,
        ]
        if (row.status === 'DRAFT') {
          items.push(
            <Typography.Link key="e" style={tableActionLinkStyle} onClick={() => navigate(`/sales/return-inbound/${row.id}/edit`)}>
              编辑
            </Typography.Link>,
            <Typography.Link key="c" style={tableActionLinkStyle} onClick={() => { setConfirmRow(row); setConfirmKind('confirm') }}>
              确认入库
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
        if (deleteSalesReturnInbound(confirmRow.id)) {
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
        if (confirmSalesReturnInbound(confirmRow.id)) {
          setToast('确认入库成功')
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
    <PageContainer title="销售退货入库单" data-anno="sales-return-inbound-list">
      <div data-anno="sales-return-inbound-tabs">
        <Tabs
          activeKey={tab}
          onChange={(k) => {
            setTab(k as ReturnInboundStatusTabKey)
            actionRef.current?.reload()
          }}
          items={RETURN_OUTBOUND_STATUS_TABS.map((t) => ({
            key: t.key,
            label: tabCountLabel(t.label, tabCounts[t.key]),
          }))}
          style={{ marginBottom: 16 }}
        />
      </div>
      <div data-anno="sales-return-inbound-filters">
        <ProTable<SalesReturnInbound>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          params={{ refreshKey, tab }}
          request={async (params) => {
            const f = paramsToFilters(params as Record<string, unknown>)
            setApplied(f)
            const data = filterSalesReturnInbounds(f, tab)
            return { data, success: true, total: data.length }
          }}
          search={{ labelWidth: 'auto' }}
          cardProps={{ 'data-anno': 'sales-return-inbound-table' } as HTMLAttributes<HTMLDivElement>}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
          toolBarRender={() => [
            <Space key="tb" data-anno="sales-return-inbound-list-toolbar">
              <Button key="n" type="primary" onClick={() => navigate('/sales/return-inbound/new')}>新增</Button>
            </Space>,
          ]}
        />
      </div>
      <Modal
        open={Boolean(confirmRow && confirmKind)}
        title={confirmKind === 'delete' ? '确认删除' : '确认入库'}
        confirmLabel={confirmKind === 'delete' ? '删除' : '确认入库'}
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
