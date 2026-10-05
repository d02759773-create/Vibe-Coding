import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Input, Space, Tabs, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { SalesOrderStatusTag } from '@/components/SalesOrderStatusTag'
import {
  STATUS_FILTER_OPTIONS,
  STATUS_TABS,
  formatYuan,
  partnerLabel,
  tabCountLabel,
  closeSalesOrderConfirmBody,
} from '@/features/salesOrders/constants'
import {
  countByTab,
  deleteSalesOrder,
  filterSalesOrders,
  getSalesOrderById,
  nowString,
  updateOrderStatus,
} from '@/features/salesOrders/storage'
import {
  submitFailureToast,
  validateOrderForSubmit,
} from '@/features/salesOrders/validate'
import type {
  SalesOrder,
  SalesOrderListFilters,
  StatusTabKey,
} from '@/features/salesOrders/types'
import { formatDateTime } from '@/features/products/format'
import { listCustomers } from '@/features/customers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: SalesOrderListFilters = {
  orderNos: '',
  customerId: '',
  warehouseId: '',
  status: '',
  orderDateFrom: '',
  orderDateTo: '',
  expectedShipFrom: '',
  expectedShipTo: '',
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

function paramsToFilters(params: Record<string, unknown>): SalesOrderListFilters {
  return {
    orderNos: String(params.orderNos ?? ''),
    customerId: String(params.customerId ?? ''),
    warehouseId: String(params.warehouseId ?? ''),
    status: (params.status ?? '') as SalesOrderListFilters['status'],
    orderDateFrom: formatDateParam(params.orderDateFrom),
    orderDateTo: formatDateParam(params.orderDateTo),
    expectedShipFrom: formatDateParam(params.expectedShipFrom),
    expectedShipTo: formatDateParam(params.expectedShipTo),
    updatedFrom: formatDateParam(params.updatedFrom),
    updatedTo: formatDateParam(params.updatedTo),
  }
}

export function SalesOrderList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<StatusTabKey>('ALL')
  const [applied, setApplied] = useState<SalesOrderListFilters>(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<SalesOrder | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const customers = useMemo(() => listCustomers().filter((c) => c.status === 'ENABLED'), [])
  const warehouses = useMemo(() => listWarehouses().filter((w) => w.status === 'ENABLED'), [])

  const tabCounts = useMemo(() => {
    void refreshKey
    return countByTab(applied)
  }, [refreshKey, applied])

  function bump() {
    setRefreshKey((k) => k + 1)
    setSelectedRowKeys([])
  }

  function openConfirm(order: SalesOrder, action: ConfirmAction) {
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
      const order = getSalesOrderById(id)
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
          if (deleteSalesOrder(id)) {
            setToast('销售订单已删除')
          }
          break
        case 'submit':
          updateOrderStatus(id, 'PENDING_AUDIT')
          setToast('已提交审核，等待审核确认')
          break
        case 'approve':
          updateOrderStatus(id, 'PENDING_OUTBOUND', {
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
          setToast('销售订单已作废')
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
    const count = selectedRowKeys.length > 0 ? selectedRowKeys.length : filterSalesOrders(applied, tab).length
    setToast(`导出成功，共导出 ${count} 条记录`)
  }

  function createInbound(order: SalesOrder) {
    navigate(`/purchase/inbound?purchaseOrderId=${order.id}&orderNo=${encodeURIComponent(order.orderNo)}`)
  }

  const confirmCopy: Record<NonNullable<ConfirmAction>, { title: string; body: string; ok: string }> = {
    delete: {
      title: '确认删除',
      body: '删除后不可恢复，该销售订单将从系统中永久移除，确认删除？',
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
      body: '驳回后单据将退回草稿，销售员可重新修改，确认驳回？',
      ok: '确认驳回',
    },
    void: {
      title: '确认作废',
      body: '作废后不可恢复，单据将进入已作废状态，确认作废？',
      ok: '确认作废',
    },
    close: {
      title: '确认关闭',
      body: '关闭后剩余未出库数量将不再接收，确认关闭订单？',
      ok: '确认关闭',
    },
  }

  const columns: ProColumns<SalesOrder>[] = useMemo(
    () => [
      {
        title: '销售单号',
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
        title: '客户',
        dataIndex: 'customerId',
        hideInTable: true,
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          showSearch: true,
          optionFilterProp: 'label',
          options: customers.map((c) => ({
            label: partnerLabel(c.customerCode, c.customerName),
            value: c.id,
          })),
        },
      },
      {
        title: '出库仓库',
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
        title: '预计发货起',
        dataIndex: 'expectedShipFrom',
        hideInTable: true,
        valueType: 'date',
      },
      {
        title: '预计发货止',
        dataIndex: 'expectedShipTo',
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
        title: '销售单号',
        dataIndex: 'orderNo',
        width: 150,
        fixed: 'left',
        copyable: true,
        search: false,
        render: (_, row) => (
          <Link to={`/sales/orders/${row.id}`}>{row.orderNo}</Link>
        ),
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        width: 120,
        search: false,
        render: (_, row) => <SalesOrderStatusTag status={row.status} />,
      },
      {
        title: '客户',
        dataIndex: 'customerName',
        ellipsis: true,
        search: false,
        render: (_, row) => partnerLabel(row.customerCode, row.customerName),
      },
      {
        title: '出库仓库',
        dataIndex: 'warehouseName',
        ellipsis: true,
        search: false,
        render: (_, row) => partnerLabel(row.warehouseCode, row.warehouseName),
      },
      { title: '下单日期', dataIndex: 'orderDate', width: 110, search: false },
      {
        title: '预计发货日期',
        dataIndex: 'expectedShipDate',
        width: 120,
        search: false,
        render: (_, row) => row.expectedShipDate ?? '-',
      },
      {
        title: '商品种数',
        dataIndex: 'skuCount',
        width: 90,
        search: false,
        render: (_, row) => `${row.skuCount} 种`,
      },
      {
        title: '销售总金额',
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
            items={buildSalesOrderRowActions(row, navigate, openConfirm, createInbound)}
          />
        ),
      },
    ],
    [tab, customers, warehouses, navigate],
  )

  return (
    <PageContainer title="销售订单" data-anno="sales-order-list">
      <Tabs
        data-anno="sales-order-tabs"
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

      <div data-anno="sales-order-filters">
        <ProTable<SalesOrder>
          data-anno="sales-order-table"
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          search={{ labelWidth: 'auto', defaultCollapsed: true }}
          params={{ tab, refreshKey }}
          request={async (params) => {
            const nextApplied = paramsToFilters(params)
            setApplied(nextApplied)
            const filtered = filterSalesOrders(nextApplied, tab)
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
            <Space key="toolbar" data-anno="sales-order-list-toolbar" size="middle">
              <Button type="primary" onClick={() => navigate('/sales/orders/new')}>
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
              ? closeSalesOrderConfirmBody(confirmTarget)
              : confirmCopy[confirmAction].body
            : ''}
        </Typography.Text>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

function buildSalesOrderRowActions(
  row: SalesOrder,
  navigate: ReturnType<typeof useNavigate>,
  onConfirm: (order: SalesOrder, action: ConfirmAction) => void,
  onInbound: (order: SalesOrder) => void,
): ReactNode[] {
  const s = row.status
  const linkStyle = tableActionLinkStyle

  const items: ReactNode[] = [
    <Button
      key="view"
      type="link"
      size="small"
      style={linkStyle}
      onClick={() => navigate(`/sales/orders/${row.id}`)}
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
        onClick={() => navigate(`/sales/orders/${row.id}/edit`)}
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
  if (s === 'PENDING_OUTBOUND') {
    items.push(
      <Button
        key="inbound"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => onInbound(row)}
      >
        创建出库单
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
  if (s === 'PARTIAL_OUTBOUND') {
    items.push(
      <Button
        key="inbound"
        type="link"
        size="small"
        style={linkStyle}
        onClick={() => onInbound(row)}
      >
        创建出库单
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
