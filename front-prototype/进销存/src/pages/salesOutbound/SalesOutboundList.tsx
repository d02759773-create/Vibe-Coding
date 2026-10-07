import { useEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Space, Tabs, Typography } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { SalesOutboundStatusTag } from '@/components/SalesOutboundStatusTag'
import {
  INBOUND_STATUS_FILTER_OPTIONS,
  INBOUND_STATUS_TABS,
  formatYuan,
  partnerLabel,
  tabCountLabel,
} from '@/features/salesOutbound/constants'
import {
  confirmSalesOutbound,
  countOutboundByTab,
  deleteSalesOutbound,
  filterSalesOutbounds,
  getSalesOutboundByNo,
} from '@/features/salesOutbound/storage'
import type { SalesOutbound, SalesOutboundListFilters, OutboundStatusTabKey } from '@/features/salesOutbound/types'
import { confirmFailureToast, validateConfirm } from '@/features/salesOutbound/validate'
import { formatDateTime } from '@/features/products/format'
import { listCustomers } from '@/features/customers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: SalesOutboundListFilters = {
  outboundNos: '',
  salesOrderNos: '',
  customerId: '',
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

function paramsToFilters(params: Record<string, unknown>): SalesOutboundListFilters {
  return {
    outboundNos: String(params.outboundNos ?? ''),
    salesOrderNos: String(params.salesOrderNos ?? ''),
    customerId: String(params.customerId ?? ''),
    warehouseId: String(params.warehouseId ?? ''),
    status: (params.status ?? '') as SalesOutboundListFilters['status'],
    outboundDateFrom: formatDateParam(params.outboundDateFrom),
    outboundDateTo: formatDateParam(params.outboundDateTo),
    updatedFrom: formatDateParam(params.updatedFrom),
    updatedTo: formatDateParam(params.updatedTo),
  }
}

export function SalesOutboundList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<OutboundStatusTabKey>('ALL')
  const [applied, setApplied] = useState<SalesOutboundListFilters>(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<SalesOutbound | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const no = searchParams.get('outboundNo')
    if (no) {
      const doc = getSalesOutboundByNo(no)
      if (doc) navigate(`/sales/outbound/${doc.id}`, { replace: true })
    }
    const soId = searchParams.get('salesOrderId')
    if (soId && !no) {
      navigate(`/sales/outbound/new?salesOrderId=${encodeURIComponent(soId)}`, { replace: true })
    }
  }, [searchParams, navigate])

  const customers = useMemo(() => listCustomers(), [refreshKey])
  const warehouses = useMemo(() => listWarehouses(), [refreshKey])
  const tabCounts = useMemo(() => countOutboundByTab(applied), [applied, refreshKey])

  const columns: ProColumns<SalesOutbound>[] = [
    {
      title: '出库单号',
      dataIndex: 'outboundNo',
      width: 180,
      fixed: 'left',
      render: (_, row) => <Link to={`/sales/outbound/${row.id}`}>{row.outboundNo}</Link>,
    },
    {
      title: '单据状态',
      dataIndex: 'status',
      width: 100,
      hideInSearch: true,
      render: (_, row) => <SalesOutboundStatusTag status={row.status} />,
    },
    {
      title: '关联销售订单号',
      dataIndex: 'salesOrderNo',
      width: 180,
      render: (_, row) => (
        <Link to={`/sales/orders/${row.salesOrderId}`}>{row.salesOrderNo}</Link>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerId',
      width: 200,
      valueType: 'select',
      fieldProps: {
        options: customers.map((s) => ({
          label: partnerLabel(s.customerCode, s.customerName),
          value: s.id,
        })),
        showSearch: true,
        allowClear: true,
      },
      render: (_, row) => partnerLabel(row.customerCode, row.customerName),
    },
    {
      title: '出库仓库',
      dataIndex: 'warehouseId',
      width: 160,
      valueType: 'select',
      fieldProps: {
        options: warehouses.map((w) => ({
          label: partnerLabel(w.warehouseCode, w.warehouseName),
          value: w.id,
        })),
        showSearch: true,
        allowClear: true,
      },
      render: (_, row) => partnerLabel(row.warehouseCode, row.warehouseName),
    },
    { title: '出库日期', dataIndex: 'outboundDate', width: 120, valueType: 'dateRange', search: { transform: (v) => ({ outboundDateFrom: v?.[0], outboundDateTo: v?.[1] }) } },
    {
      title: '本次出库总数量',
      dataIndex: 'totalShipQty',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '出库总金额（含税）',
      dataIndex: 'totalAmount',
      width: 130,
      hideInSearch: true,
      render: (_, row) => formatYuan(row.totalAmount),
    },
    {
      title: '最后修改时间',
      dataIndex: 'updatedAt',
      width: 170,
      hideInSearch: true,
      render: (_, row) => formatDateTime(row.updatedAt),
    },
    {
      title: '出库单号',
      dataIndex: 'outboundNos',
      hideInTable: true,
    },
    {
      title: '关联销售订单号',
      dataIndex: 'salesOrderNos',
      hideInTable: true,
    },
    {
      title: '单据状态',
      dataIndex: 'status',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: INBOUND_STATUS_FILTER_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
      },
      hideInSearch: tab !== 'ALL',
    },
    {
      title: '最后修改时间',
      dataIndex: 'updatedAtRange',
      hideInTable: true,
      valueType: 'dateRange',
      search: { transform: (v) => ({ updatedFrom: v?.[0], updatedTo: v?.[1] }) },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, row) => {
        const items = [
          <Typography.Link
            key="view"
            style={tableActionLinkStyle}
            onClick={() => navigate(`/sales/outbound/${row.id}`)}
          >
            查看
          </Typography.Link>,
        ]
        if (row.status === 'DRAFT') {
          items.push(
            <Typography.Link
              key="edit"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/sales/outbound/${row.id}/edit`)}
            >
              编辑
            </Typography.Link>,
          )
          if (!row.confirmBlocked) {
            items.push(
              <Typography.Link
                key="confirm"
                style={tableActionLinkStyle}
                onClick={() => openConfirm(row, 'confirm')}
              >
                确认出库
              </Typography.Link>,
            )
          }
          items.push(
            <Typography.Link
              key="delete"
              style={tableActionLinkStyle}
              onClick={() => openConfirm(row, 'delete')}
            >
              删除
            </Typography.Link>,
          )
        }
        return <TableRowActions items={items} />
      },
    },
  ]

  function openConfirm(row: SalesOutbound, kind: 'delete' | 'confirm') {
    setConfirmRow(row)
    setConfirmKind(kind)
  }

  function closeConfirm() {
    setConfirmRow(null)
    setConfirmKind(null)
  }

  function bump() {
    setRefreshKey((k) => k + 1)
  }

  async function runConfirm() {
    if (!confirmRow || !confirmKind) return
    setLoading(true)
    try {
      if (confirmKind === 'delete') {
        if (deleteSalesOutbound(confirmRow.id)) {
          setToast('销售出库单已删除')
          bump()
          actionRef.current?.reload()
        }
      } else {
        const v = validateConfirm(confirmRow)
        if (!v.ok) {
          setToast(v.message ?? confirmFailureToast(v))
          return
        }
        if (confirmSalesOutbound(confirmRow.id)) {
          setToast('出库确认成功')
          bump()
          actionRef.current?.reload()
        }
      }
      closeConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="销售出库单" data-anno="sales-outbound-list">
      <div data-anno="sales-outbound-tabs">
        <Tabs
          activeKey={tab}
          onChange={(k) => {
            setTab(k as OutboundStatusTabKey)
            actionRef.current?.reload()
          }}
          items={INBOUND_STATUS_TABS.map((t) => ({
            key: t.key,
            label: `${t.label} ${tabCountLabel(tabCounts[t.key])}`,
          }))}
          style={{ marginBottom: 16 }}
        />
      </div>
      <div data-anno="sales-outbound-filters">
        <ProTable<SalesOutbound>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          params={{ refreshKey, tab }}
          request={async (params) => {
            void refreshKey
            const f = paramsToFilters(params as Record<string, unknown>)
            setApplied(f)
            const data = filterSalesOutbounds(f, tab)
            return { data, success: true, total: data.length }
          }}
          search={{ labelWidth: 'auto', defaultCollapsed: false }}
          cardProps={{ 'data-anno': 'sales-outbound-table' } as HTMLAttributes<HTMLDivElement>}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          toolBarRender={() => [
            <Space key="tb" data-anno="sales-outbound-list-toolbar">
              <Button type="primary" onClick={() => navigate('/sales/outbound/new')}>新增</Button>
              <Button type="button" variant="outline" onClick={() => setToast('导出成功，共导出 N 条记录')}>
                导出
              </Button>
            </Space>,
          ]}
        />
      </div>
      <Modal
        open={Boolean(confirmRow && confirmKind)}
        title={confirmKind === 'delete' ? '确认删除' : '确认出库'}
        confirmLabel={confirmKind === 'delete' ? '确认删除' : '确认出库'}
        confirmVariant={confirmKind === 'delete' ? 'destructive' : 'default'}
        confirmDisabled={loading}
        onClose={closeConfirm}
        onConfirm={runConfirm}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {confirmKind === 'delete'
            ? '删除后不可恢复，该出库单将从系统中永久移除，确认删除？'
            : '确认后将减少库存，是否继续？'}
        </Typography.Paragraph>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
