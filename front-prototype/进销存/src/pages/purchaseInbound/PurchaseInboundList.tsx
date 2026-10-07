import { useEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Space, Tabs, Typography } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseInboundStatusTag } from '@/components/PurchaseInboundStatusTag'
import {
  INBOUND_STATUS_FILTER_OPTIONS,
  INBOUND_STATUS_TABS,
  formatYuan,
  partnerLabel,
  tabCountLabel,
} from '@/features/purchaseInbound/constants'
import {
  confirmPurchaseInbound,
  countInboundByTab,
  deletePurchaseInbound,
  filterPurchaseInbounds,
  getPurchaseInboundByNo,
} from '@/features/purchaseInbound/storage'
import type { PurchaseInbound, PurchaseInboundListFilters, InboundStatusTabKey } from '@/features/purchaseInbound/types'
import { confirmFailureToast, validateConfirm } from '@/features/purchaseInbound/validate'
import { formatDateTime } from '@/features/products/format'
import { listSuppliers } from '@/features/suppliers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: PurchaseInboundListFilters = {
  inboundNos: '',
  purchaseOrderNos: '',
  supplierId: '',
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

function paramsToFilters(params: Record<string, unknown>): PurchaseInboundListFilters {
  return {
    inboundNos: String(params.inboundNos ?? ''),
    purchaseOrderNos: String(params.purchaseOrderNos ?? ''),
    supplierId: String(params.supplierId ?? ''),
    warehouseId: String(params.warehouseId ?? ''),
    status: (params.status ?? '') as PurchaseInboundListFilters['status'],
    inboundDateFrom: formatDateParam(params.inboundDateFrom),
    inboundDateTo: formatDateParam(params.inboundDateTo),
    updatedFrom: formatDateParam(params.updatedFrom),
    updatedTo: formatDateParam(params.updatedTo),
  }
}

export function PurchaseInboundList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<InboundStatusTabKey>('ALL')
  const [applied, setApplied] = useState<PurchaseInboundListFilters>(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<PurchaseInbound | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const no = searchParams.get('inboundNo')
    if (no) {
      const doc = getPurchaseInboundByNo(no)
      if (doc) navigate(`/purchase/inbound/${doc.id}`, { replace: true })
    }
    const poId = searchParams.get('purchaseOrderId')
    if (poId && !no) {
      navigate(`/purchase/inbound/new?purchaseOrderId=${encodeURIComponent(poId)}`, { replace: true })
    }
  }, [searchParams, navigate])

  const suppliers = useMemo(() => listSuppliers(), [refreshKey])
  const warehouses = useMemo(() => listWarehouses(), [refreshKey])
  const tabCounts = useMemo(() => countInboundByTab(applied), [applied, refreshKey])

  const columns: ProColumns<PurchaseInbound>[] = [
    {
      title: '入库单号',
      dataIndex: 'inboundNo',
      width: 180,
      fixed: 'left',
      render: (_, row) => <Link to={`/purchase/inbound/${row.id}`}>{row.inboundNo}</Link>,
    },
    {
      title: '单据状态',
      dataIndex: 'status',
      width: 100,
      hideInSearch: true,
      render: (_, row) => <PurchaseInboundStatusTag status={row.status} />,
    },
    {
      title: '关联采购单号',
      dataIndex: 'purchaseOrderNo',
      width: 180,
      render: (_, row) => (
        <Link to={`/purchase/orders/${row.purchaseOrderId}`}>{row.purchaseOrderNo}</Link>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplierId',
      width: 200,
      valueType: 'select',
      fieldProps: {
        options: suppliers.map((s) => ({
          label: partnerLabel(s.supplierCode, s.supplierName),
          value: s.id,
        })),
        showSearch: true,
        allowClear: true,
      },
      render: (_, row) => partnerLabel(row.supplierCode, row.supplierName),
    },
    {
      title: '入库仓库',
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
    { title: '入库日期', dataIndex: 'inboundDate', width: 120, valueType: 'dateRange', search: { transform: (v) => ({ inboundDateFrom: v?.[0], inboundDateTo: v?.[1] }) } },
    {
      title: '本次入库总数量',
      dataIndex: 'totalStockInQty',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '入库总金额（含税）',
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
      title: '入库单号',
      dataIndex: 'inboundNos',
      hideInTable: true,
    },
    {
      title: '关联采购单号',
      dataIndex: 'purchaseOrderNos',
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
            onClick={() => navigate(`/purchase/inbound/${row.id}`)}
          >
            查看
          </Typography.Link>,
        ]
        if (row.status === 'DRAFT') {
          items.push(
            <Typography.Link
              key="edit"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/purchase/inbound/${row.id}/edit`)}
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
                确认入库
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

  function openConfirm(row: PurchaseInbound, kind: 'delete' | 'confirm') {
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
        if (deletePurchaseInbound(confirmRow.id)) {
          setToast('采购入库单已删除')
          bump()
          actionRef.current?.reload()
        }
      } else {
        const v = validateConfirm(confirmRow)
        if (!v.ok) {
          setToast(v.message ?? confirmFailureToast(v))
          return
        }
        if (confirmPurchaseInbound(confirmRow.id)) {
          setToast('入库确认成功')
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
    <PageContainer title="采购入库单" data-anno="purchase-inbound-list">
      <div data-anno="purchase-inbound-tabs">
        <Tabs
          activeKey={tab}
          onChange={(k) => {
            setTab(k as InboundStatusTabKey)
            actionRef.current?.reload()
          }}
          items={INBOUND_STATUS_TABS.map((t) => ({
            key: t.key,
            label: `${t.label} ${tabCountLabel(tabCounts[t.key])}`,
          }))}
          style={{ marginBottom: 16 }}
        />
      </div>
      <div data-anno="purchase-inbound-filters">
        <ProTable<PurchaseInbound>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          params={{ refreshKey, tab }}
          request={async (params) => {
            void refreshKey
            const f = paramsToFilters(params as Record<string, unknown>)
            setApplied(f)
            const data = filterPurchaseInbounds(f, tab)
            return { data, success: true, total: data.length }
          }}
          search={{ labelWidth: 'auto', defaultCollapsed: false }}
          cardProps={{ 'data-anno': 'purchase-inbound-table' } as HTMLAttributes<HTMLDivElement>}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          toolBarRender={() => [
            <Space key="tb" data-anno="purchase-inbound-list-toolbar">
              <Button type="primary" onClick={() => navigate('/purchase/inbound/new')}>新增</Button>
              <Button type="button" variant="outline" onClick={() => setToast('导出成功，共导出 N 条记录')}>
                导出
              </Button>
            </Space>,
          ]}
        />
      </div>
      <Modal
        open={Boolean(confirmRow && confirmKind)}
        title={confirmKind === 'delete' ? '确认删除' : '确认入库'}
        confirmLabel={confirmKind === 'delete' ? '确认删除' : '确认入库'}
        confirmVariant={confirmKind === 'delete' ? 'destructive' : 'default'}
        confirmDisabled={loading}
        onClose={closeConfirm}
        onConfirm={runConfirm}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {confirmKind === 'delete'
            ? '删除后不可恢复，该入库单将从系统中永久移除，确认删除？'
            : '确认后将增加库存并生成应付，是否继续？'}
        </Typography.Paragraph>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
