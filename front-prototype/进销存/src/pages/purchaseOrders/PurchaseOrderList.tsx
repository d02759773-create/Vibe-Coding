import { useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Input, Space, Tabs, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseOrderStatusTag } from '@/components/PurchaseOrderStatusTag'
import {
  STATUS_FILTER_OPTIONS,
  STATUS_TABS,
  formatYuan,
  partnerLabel,
  tabCountLabel,
  closeOrderConfirmBody,
} from '@/features/purchaseOrders/constants'
import {
  countByTab,
  deletePurchaseOrder,
  filterPurchaseOrders,
  getPurchaseOrderById,
  nowString,
  updateOrderStatus,
} from '@/features/purchaseOrders/storage'
import {
  submitFailureToast,
  validateOrderForSubmit,
} from '@/features/purchaseOrders/validate'
import type {
  PurchaseOrder,
  PurchaseOrderListFilters,
  StatusTabKey,
} from '@/features/purchaseOrders/types'
import { formatDateTime } from '@/features/products/format'
import { listSuppliers } from '@/features/suppliers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: PurchaseOrderListFilters = {
  orderNos: '',
  supplierId: '',
  warehouseId: '',
  status: '',
  orderDateFrom: '',
  orderDateTo: '',
  expectedDateFrom: '',
  expectedDateTo: '',
  updatedFrom: '',
  updatedTo: '',
}

type ConfirmAction =
  | 'delete'
  | 'submit'
  | 'approve'
  | 'reject'
  | 'void'
  | 'close'
  | null

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

function paramsToFilters(params: Record<string, unknown>): PurchaseOrderListFilters {
  return {
    orderNos: String(params.orderNos ?? ''),
    supplierId: String(params.supplierId ?? ''),
    warehouseId: String(params.warehouseId ?? ''),
    status: (params.status ?? '') as PurchaseOrderListFilters['status'],
    orderDateFrom: formatDateParam(params.orderDateFrom),
    orderDateTo: formatDateParam(params.orderDateTo),
    expectedDateFrom: formatDateParam(params.expectedDateFrom),
    expectedDateTo: formatDateParam(params.expectedDateTo),
    updatedFrom: formatDateParam(params.updatedFrom),
    updatedTo: formatDateParam(params.updatedTo),
  }
}

export function PurchaseOrderList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<StatusTabKey>('ALL')
  const [applied, setApplied] = useState<PurchaseOrderListFilters>(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<PurchaseOrder | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const suppliers = useMemo(() => listSuppliers().filter((s) => s.status === 'ENABLED'), [])
  const warehouses = useMemo(() => listWarehouses().filter((w) => w.status === 'ENABLED'), [])

  const tabCounts = useMemo(() => {
    void refreshKey
    return countByTab(applied)
  }, [refreshKey, applied])

  function bump() {
    setRefreshKey((k) => k + 1)
    setSelectedRowKeys([])
  }

  function openConfirm(order: PurchaseOrder, action: ConfirmAction) {
    setConfirmTarget(order)
    setConfirmAction(action)
  }

  function closeConfirm() {
    setConfirmTarget(null)
    setConfirmAction(null)
  }

  function runConfirm() {
    if (!confirmTarget || !confirmAction || confirmLoading) return
    const id = confirmTarget.id
    const ts = nowString()

    if (confirmAction === 'submit') {
      const order = getPurchaseOrderById(id)
      if (!order) {
        closeConfirm()
        return
      }
      const result = validateOrderForSubmit(order)
      if (!result.ok) {
        setToast(submitFailureToast(result))
        closeConfirm()
        return
      }
    }

    setConfirmLoading(true)
    try {
      switch (confirmAction) {
        case 'delete':
          if (deletePurchaseOrder(id)) {
            setToast('采购订单已删除')
          }
          break
        case 'submit':
          updateOrderStatus(id, 'PENDING_AUDIT')
          setToast('已提交审核，等待审核确认')
          break
        case 'approve':
          updateOrderStatus(id, 'PENDING_STOCK_IN', {
            auditedBy: '林强',
            auditedAt: ts,
          })
          setToast('审核通过')
          break
        case 'reject':
          updateOrderStatus(id, 'DRAFT', { auditedBy: null, auditedAt: null })
          setToast('已驳回，单据已退回草稿')
          break
        case 'void':
          updateOrderStatus(id, 'VOIDED')
          setToast('采购订单已作废')
          break
        case 'close':
          updateOrderStatus(id, 'COMPLETED')
          setToast('订单已关闭，剩余数量不再接收')
          break
        default:
          break
      }
      closeConfirm()
      bump()
      actionRef.current?.reload()
    } finally {
      setConfirmLoading(false)
    }
  }

  function handleExport() {
    const count = selectedRowKeys.length > 0 ? selectedRowKeys.length : filterPurchaseOrders(applied, tab).length
    setToast(`导出成功，共导出 ${count} 条记录`)
  }

  function createInbound(order: PurchaseOrder) {
    navigate(`/purchase/inbound?purchaseOrderId=${order.id}&orderNo=${encodeURIComponent(order.orderNo)}`)
  }

  const confirmCopy: Record<NonNullable<ConfirmAction>, { title: string; body: string; ok: string }> = {
    delete: {
      title: '确认删除',
      body: '删除后不可恢复，该采购订单将从系统中永久移除，确认删除？',
      ok: '确认删除',
    },
    submit: {
      title: '提交审核',
      body: '提交后单据将进入待审核状态，确认提交？',
      ok: '确认提交',
    },
    approve: {
      title: '确认审核',
      body: '审核通过后关键字段将锁定，不可再修改，确认审核通过？',
      ok: '确认审核',
    },
    reject: {
      title: '确认驳回',
      body: '驳回后单据将退回草稿，采购员可重新修改，确认驳回？',
      ok: '确认驳回',
    },
    void: {
      title: '确认作废',
      body: '作废后不可恢复，单据将进入已作废状态，确认作废？',
      ok: '确认作废',
    },
    close: {
      title: '确认关闭',
      body: '关闭后剩余未入库数量将不再接收，确认关闭订单？',
      ok: '确认关闭',
    },
  }

  const columns: ProColumns<PurchaseOrder>[] = useMemo(
    () => [
      {
        title: '采购单号',
        dataIndex: 'orderNos',
        hideInTable: true,
        renderFormItem: () => (
          <Input.TextArea
            placeholder="多个单号换行或逗号分隔"
            autoSize={{ minRows: 1, maxRows: 3 }}
            allowClear
          />
        ),
      },
      {
        title: '供应商',
        dataIndex: 'supplierId',
        hideInTable: true,
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          showSearch: true,
          optionFilterProp: 'label',
          options: suppliers.map((s) => ({
            label: partnerLabel(s.supplierCode, s.supplierName),
            value: s.id,
          })),
        },
      },
      {
        title: '入库仓库',
        dataIndex: 'warehouseId',
        hideInTable: true,
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          showSearch: true,
          optionFilterProp: 'label',
          options: warehouses.map((w) => ({
            label: partnerLabel(w.warehouseCode, w.warehouseName),
            value: w.id,
          })),
        },
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        hideInTable: true,
        hideInSearch: tab !== 'ALL',
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          options: STATUS_FILTER_OPTIONS.filter((o) => o.value !== '').map((o) => ({
            label: o.label,
            value: o.value,
          })),
        },
      },
      {
        title: '下单日期起',
        dataIndex: 'orderDateFrom',
        hideInTable: true,
        valueType: 'date',
      },
      {
        title: '下单日期止',
        dataIndex: 'orderDateTo',
        hideInTable: true,
        valueType: 'date',
      },
      {
        title: '预计到货起',
        dataIndex: 'expectedDateFrom',
        hideInTable: true,
        valueType: 'date',
      },
      {
        title: '预计到货止',
        dataIndex: 'expectedDateTo',
        hideInTable: true,
        valueType: 'date',
      },
      {
        title: '最后修改起',
        dataIndex: 'updatedFrom',
        hideInTable: true,
        valueType: 'date',
      },
      {
        title: '最后修改止',
        dataIndex: 'updatedTo',
        hideInTable: true,
        valueType: 'date',
      },
      {
        title: '采购单号',
        dataIndex: 'orderNo',
        width: 150,
        fixed: 'left',
        copyable: true,
        search: false,
        render: (_, row) => (
          <Link to={`/purchase/orders/${row.id}`}>{row.orderNo}</Link>
        ),
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        width: 120,
        search: false,
        render: (_, row) => <PurchaseOrderStatusTag status={row.status} />,
      },
      {
        title: '供应商',
        dataIndex: 'supplierName',
        ellipsis: true,
        search: false,
        render: (_, row) => partnerLabel(row.supplierCode, row.supplierName),
      },
      {
        title: '入库仓库',
        dataIndex: 'warehouseName',
        ellipsis: true,
        search: false,
        render: (_, row) => partnerLabel(row.warehouseCode, row.warehouseName),
      },
      { title: '下单日期', dataIndex: 'orderDate', width: 110, search: false },
      {
        title: '预计到货日期',
        dataIndex: 'expectedArrivalDate',
        width: 120,
        search: false,
        render: (_, row) => row.expectedArrivalDate ?? '-',
      },
      {
        title: '商品种数',
        dataIndex: 'skuCount',
        width: 90,
        search: false,
        render: (_, row) => `${row.skuCount} 种`,
      },
      {
        title: '采购总金额',
        dataIndex: 'totalAmount',
        width: 120,
        align: 'right',
        search: false,
        render: (_, row) => formatYuan(row.totalAmount),
      },
      {
        title: '最后修改时间',
        dataIndex: 'updatedAt',
        width: 170,
        search: false,
        render: (_, row) => formatDateTime(row.updatedAt),
      },
      {
        title: '操作',
        valueType: 'option',
        width: 300,
        fixed: 'right',
        search: false,
        render: (_, row) => (
          <TableRowActions
            items={buildPurchaseOrderRowActions(row, navigate, openConfirm, createInbound)}
          />
        ),
      },
    ],
    [tab, suppliers, warehouses, navigate],
  )

  return (
    <PageContainer title="采购订单" data-anno="purchase-order-list">
      <div data-anno="purchase-order-tabs">
        <Tabs
          activeKey={tab}
          onChange={(key) => {
            setTab(key as typeof tab)
            setSelectedRowKeys([])
            actionRef.current?.reload()
          }}
          items={STATUS_TABS.map((t) => ({
            key: t.key,
            label: `${t.label} ${tabCountLabel(tabCounts[t.key])}`,
          }))}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div data-anno="purchase-order-filters">
        <ProTable<PurchaseOrder>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          search={{ labelWidth: 'auto', defaultCollapsed: true }}
          cardProps={{
            'data-anno': 'purchase-order-table',
          } as HTMLAttributes<HTMLDivElement>}
          params={{ tab, refreshKey }}
          request={async (params) => {
            const nextApplied = paramsToFilters(params)
            setApplied(nextApplied)
            const filtered = filterPurchaseOrders(nextApplied, tab)
            const current = params.current ?? 1
            const pageSize = params.pageSize ?? 20
            const start = (current - 1) * pageSize
            return {
              data: filtered.slice(start, start + pageSize),
              success: true,
              total: filtered.length,
            }
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          toolBarRender={() => [
            <Space key="toolbar" data-anno="purchase-order-list-toolbar" size="middle">
              <Button type="primary" onClick={() => navigate('/purchase/orders/new')}>
                新增
              </Button>
              <Button variant="outline" onClick={handleExport}>
                导出
              </Button>
            </Space>,
          ]}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
          }}
          scroll={{ x: 1100 }}
          options={false}
          columnEmptyText="暂无数据"
        />
      </div>

      <Modal
        open={Boolean(confirmTarget && confirmAction)}
        title={confirmAction ? confirmCopy[confirmAction].title : ''}
        confirmLabel={confirmAction ? confirmCopy[confirmAction].ok : '确认'}
        confirmVariant={confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'}
        confirmDisabled={confirmLoading}
        onClose={closeConfirm}
        onConfirm={runConfirm}
      >
        <Typography.Text type="secondary">
          {confirmAction && confirmTarget
            ? confirmAction === 'close'
              ? closeOrderConfirmBody(confirmTarget)
              : confirmCopy[confirmAction].body
            : ''}
        </Typography.Text>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

function buildPurchaseOrderRowActions(
  row: PurchaseOrder,
  navigate: ReturnType<typeof useNavigate>,
  onConfirm: (order: PurchaseOrder, action: ConfirmAction) => void,
  onInbound: (order: PurchaseOrder) => void,
): ReactNode[] {
  const s = row.status
  const linkStyle = tableActionLinkStyle

  const items: ReactNode[] = [
    <Button
      key="view"
      type="link"
      size="small"
      style={linkStyle}
      onClick={() => navigate(`/purchase/orders/${row.id}`)}
    >
      查看
    </Button>,
  ]

  if (s === 'DRAFT') {
    items.push(
      <Button
        key="edit"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => navigate(`/purchase/orders/${row.id}/edit`)}
      >
        编辑
      </Button>,
      <Button
        key="submit"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => onConfirm(row, 'submit')}
      >
        提交审核
      </Button>,
      <Button
        key="delete"
        type="link"
        size="small"
        danger
        style={linkStyle}
        onClick={() => onConfirm(row, 'delete')}
      >
        删除
      </Button>,
    )
  }
  if (s === 'PENDING_AUDIT') {
    items.push(
      <Button
        key="approve"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => onConfirm(row, 'approve')}
      >
        审核
      </Button>,
      <Button
        key="reject"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => onConfirm(row, 'reject')}
      >
        驳回
      </Button>,
      <Button
        key="void"
        type="link"
        size="small"
        danger
        style={linkStyle}
        onClick={() => onConfirm(row, 'void')}
      >
        作废
      </Button>,
    )
  }
  if (s === 'PENDING_STOCK_IN') {
    items.push(
      <Button
        key="inbound"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => onInbound(row)}
      >
        创建入库单
      </Button>,
      <Button
        key="void"
        type="link"
        size="small"
        danger
        style={linkStyle}
        onClick={() => onConfirm(row, 'void')}
      >
        作废
      </Button>,
    )
  }
  if (s === 'PARTIAL_STOCK_IN') {
    items.push(
      <Button
        key="inbound"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => onInbound(row)}
      >
        创建入库单
      </Button>,
      <Button
        key="close"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => onConfirm(row, 'close')}
      >
        关闭订单
      </Button>,
    )
  }

  return items
}
