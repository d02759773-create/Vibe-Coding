import { useEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Space, Tabs, Typography } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseReturnStatusTag } from '@/components/PurchaseReturnStatusTag'
import {
  RETURN_STATUS_FILTER_OPTIONS,
  RETURN_STATUS_TABS,
  formatYuan,
  partnerLabel,
  tabCountLabel,
} from '@/features/purchaseReturns/constants'
import {
  approvePurchaseReturn,
  countReturnByTab,
  deletePurchaseReturn,
  filterPurchaseReturns,
  getPurchaseReturnByNo,
  maxReturnableQty,
  rejectPurchaseReturn,
  submitPurchaseReturn,
  voidPurchaseReturn,
} from '@/features/purchaseReturns/storage'
import type { PurchaseReturn, PurchaseReturnListFilters, ReturnStatusTabKey } from '@/features/purchaseReturns/types'
import { submitFailureToast, validateSubmit } from '@/features/purchaseReturns/validate'
import { formatDateTime } from '@/features/products/format'
import { listSuppliers } from '@/features/suppliers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: PurchaseReturnListFilters = {
  returnNos: '',
  inboundNos: '',
  purchaseOrderNos: '',
  supplierId: '',
  warehouseId: '',
  status: '',
  returnDateFrom: '',
  returnDateTo: '',
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

function paramsToFilters(params: Record<string, unknown>): PurchaseReturnListFilters {
  return {
    returnNos: String(params.returnNos ?? ''),
    inboundNos: String(params.inboundNos ?? ''),
    purchaseOrderNos: String(params.purchaseOrderNos ?? ''),
    supplierId: String(params.supplierId ?? ''),
    warehouseId: String(params.warehouseId ?? ''),
    status: (params.status ?? '') as PurchaseReturnListFilters['status'],
    returnDateFrom: formatDateParam(params.returnDateFrom),
    returnDateTo: formatDateParam(params.returnDateTo),
    updatedFrom: formatDateParam(params.updatedFrom),
    updatedTo: formatDateParam(params.updatedTo),
  }
}

type ConfirmKind = 'delete' | 'submit' | 'approve' | 'reject' | 'void'

export function PurchaseReturnList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<ReturnStatusTabKey>('ALL')
  const [applied, setApplied] = useState(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<PurchaseReturn | null>(null)
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const no = searchParams.get('returnNo')
    if (no) {
      const doc = getPurchaseReturnByNo(no)
      if (doc) navigate(`/purchase/returns/${doc.id}`, { replace: true })
    }
  }, [searchParams, navigate])

  const suppliers = useMemo(() => listSuppliers(), [refreshKey])
  const warehouses = useMemo(() => listWarehouses(), [refreshKey])
  const tabCounts = useMemo(() => countReturnByTab(applied), [applied, refreshKey])

  const columns: ProColumns<PurchaseReturn>[] = [
    {
      title: '退货单号',
      dataIndex: 'returnNo',
      width: 180,
      fixed: 'left',
      render: (_, row) => <Link to={`/purchase/returns/${row.id}`}>{row.returnNo}</Link>,
    },
    {
      title: '单据状态',
      hideInSearch: true,
      width: 100,
      render: (_, row) => <PurchaseReturnStatusTag status={row.status} />,
    },
    {
      title: '关联入库单号',
      dataIndex: 'inboundNo',
      width: 180,
      render: (_, row) => <Link to={`/purchase/inbound/${row.inboundId}`}>{row.inboundNo}</Link>,
    },
    {
      title: '关联采购单号',
      dataIndex: 'purchaseOrderNo',
      width: 180,
      render: (_, row) => <Link to={`/purchase/orders/${row.purchaseOrderId}`}>{row.purchaseOrderNo}</Link>,
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
      render: (_, row) => partnerLabel(row.supplierCode, row.supplierName),
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
      render: (_, row) => partnerLabel(row.warehouseCode, row.warehouseName),
    },
    {
      title: '退货日期',
      dataIndex: 'returnDate',
      valueType: 'dateRange',
      search: { transform: (v) => ({ returnDateFrom: v?.[0], returnDateTo: v?.[1] }) },
    },
    { title: '退货总数量', dataIndex: 'totalReturnQty', hideInSearch: true },
    { title: '退货总金额', dataIndex: 'totalAmount', hideInSearch: true, render: (_, r) => formatYuan(r.totalAmount) },
    { title: '最后修改时间', dataIndex: 'updatedAt', hideInSearch: true, render: (_, r) => formatDateTime(r.updatedAt) },
    { title: '退货单号', dataIndex: 'returnNos', hideInTable: true },
    { title: '关联入库单号', dataIndex: 'inboundNos', hideInTable: true },
    { title: '关联采购单号', dataIndex: 'purchaseOrderNos', hideInTable: true },
    {
      title: '单据状态',
      dataIndex: 'status',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { options: RETURN_STATUS_FILTER_OPTIONS.map((o) => ({ label: o.label, value: o.value })) },
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
      fixed: 'right',
      width: 220,
      render: (_, row) => {
        const items = [
          <Typography.Link key="view" style={tableActionLinkStyle} onClick={() => navigate(`/purchase/returns/${row.id}`)}>
            查看
          </Typography.Link>,
        ]
        if (row.status === 'DRAFT') {
          items.push(
            <Typography.Link key="edit" style={tableActionLinkStyle} onClick={() => navigate(`/purchase/returns/${row.id}/edit`)}>
              编辑
            </Typography.Link>,
            <Typography.Link key="submit" style={tableActionLinkStyle} onClick={() => openConfirm(row, 'submit')}>
              提交审核
            </Typography.Link>,
            <Typography.Link key="del" style={tableActionLinkStyle} onClick={() => openConfirm(row, 'delete')}>
              删除
            </Typography.Link>,
          )
        }
        if (row.status === 'PENDING_AUDIT') {
          items.push(
            <Typography.Link key="approve" style={tableActionLinkStyle} onClick={() => openConfirm(row, 'approve')}>
              审核通过
            </Typography.Link>,
            <Typography.Link key="reject" style={tableActionLinkStyle} onClick={() => openConfirm(row, 'reject')}>
              驳回
            </Typography.Link>,
            <Typography.Link key="void" style={tableActionLinkStyle} onClick={() => openConfirm(row, 'void')}>
              作废
            </Typography.Link>,
          )
        }
        if (['PENDING_OUTBOUND', 'PARTIAL_OUTBOUND'].includes(row.status)) {
          items.push(
            <Typography.Link
              key="out"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/purchase/return-outbound/new?returnId=${row.id}`)}
            >
              创建出库单
            </Typography.Link>,
          )
        }
        return <TableRowActions items={items} />
      },
    },
  ]

  function openConfirm(row: PurchaseReturn, kind: ConfirmKind) {
    setConfirmRow(row)
    setConfirmKind(kind)
  }

  function bump() {
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  async function runConfirm() {
    if (!confirmRow || !confirmKind) return
    setLoading(true)
    try {
      const row = confirmRow
      let ok = false
      if (confirmKind === 'delete') ok = deletePurchaseReturn(row.id)
      if (confirmKind === 'submit') {
        const err = validateSubmit(row, (lid) => maxReturnableQty(row.inboundId, lid, row.id))
        if (err) {
          setToast(submitFailureToast(err))
          return
        }
        ok = submitPurchaseReturn(row.id)
      }
      if (confirmKind === 'approve') ok = approvePurchaseReturn(row.id)
      if (confirmKind === 'reject') ok = rejectPurchaseReturn(row.id)
      if (confirmKind === 'void') ok = voidPurchaseReturn(row.id)
      if (ok) {
        setToast('操作成功')
        bump()
      }
      setConfirmRow(null)
      setConfirmKind(null)
    } finally {
      setLoading(false)
    }
  }

  const modalCopy: Record<ConfirmKind, { title: string; body: string; ok: string; destructive?: boolean }> = {
    delete: { title: '确认删除', body: '删除后不可恢复，确认删除？', ok: '确认删除', destructive: true },
    submit: { title: '提交审核', body: '提交后进入待审核，确认提交？', ok: '确认提交' },
    approve: { title: '审核通过', body: '审核通过后数量锁定，确认通过？', ok: '确认审核' },
    reject: { title: '驳回', body: '驳回后退回草稿，确认驳回？', ok: '确认驳回', destructive: true },
    void: { title: '作废', body: '作废后不可恢复，确认作废？', ok: '确认作废', destructive: true },
  }

  const mc = confirmKind ? modalCopy[confirmKind] : null

  return (
    <PageContainer title="采购退货单" data-anno="purchase-return-list">
      <div data-anno="purchase-return-tabs">
        <Tabs
          activeKey={tab}
          onChange={(k) => {
            setTab(k as ReturnStatusTabKey)
            actionRef.current?.reload()
          }}
          items={RETURN_STATUS_TABS.map((t) => ({
            key: t.key,
            label: tabCountLabel(t.label, tabCounts[t.key]),
          }))}
          style={{ marginBottom: 16 }}
        />
      </div>
      <div data-anno="purchase-return-filters">
        <ProTable<PurchaseReturn>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          params={{ refreshKey, tab }}
          request={async (params) => {
            void refreshKey
            const f = paramsToFilters(params as Record<string, unknown>)
            setApplied(f)
            const data = filterPurchaseReturns(f, tab)
            return { data, success: true, total: data.length }
          }}
          search={{ labelWidth: 'auto' }}
          cardProps={{ 'data-anno': 'purchase-return-table' } as HTMLAttributes<HTMLDivElement>}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          toolBarRender={() => [
            <Space key="tb" data-anno="purchase-return-list-toolbar">
              <Button key="new" type="primary" onClick={() => navigate('/purchase/returns/new')}>新增</Button>
              <Button key="exp" type="button" variant="outline" onClick={() => setToast('导出成功')}>导出</Button>
            </Space>,
          ]}
        />
      </div>
      {mc && (
        <Modal
          open={Boolean(confirmRow)}
          title={mc.title}
          confirmLabel={mc.ok}
          confirmVariant={mc.destructive ? 'destructive' : 'default'}
          confirmDisabled={loading}
          onClose={() => {
            setConfirmRow(null)
            setConfirmKind(null)
          }}
          onConfirm={runConfirm}
        >
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>{mc.body}</Typography.Paragraph>
        </Modal>
      )}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
