import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseOrderStatusTag } from '@/components/PurchaseOrderStatusTag'
import {
  STATUS_FILTER_OPTIONS,
  STATUS_TABS,
  formatYuan,
  partnerLabel,
  tabCountLabel,
} from '@/features/purchaseOrders/constants'
import {
  countByTab,
  deletePurchaseOrder,
  filterPurchaseOrders,
  nowString,
  updateOrderStatus,
} from '@/features/purchaseOrders/storage'
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

export function PurchaseOrderList() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<StatusTabKey>('ALL')
  const [filters, setFilters] = useState(defaultFilters)
  const [applied, setApplied] = useState(defaultFilters)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<PurchaseOrder | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const suppliers = useMemo(() => listSuppliers().filter((s) => s.status === 'ENABLED'), [])
  const warehouses = useMemo(() => listWarehouses().filter((w) => w.status === 'ENABLED'), [])

  const tabCounts = useMemo(() => {
    void refreshKey
    return countByTab(applied)
  }, [refreshKey, applied])

  const filtered = useMemo(() => {
    void refreshKey
    return filterPurchaseOrders(applied, tab)
  }, [refreshKey, applied, tab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageSafe = Math.min(page, totalPages)
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize)

  function bump() {
    setRefreshKey((k) => k + 1)
    setSelectedIds(new Set())
  }

  function handleSearch() {
    setApplied({ ...filters })
    setPage(1)
  }

  function handleReset() {
    setFilters(defaultFilters)
    setApplied(defaultFilters)
    setPage(1)
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
    if (!confirmTarget || !confirmAction) return
    const id = confirmTarget.id
    const ts = nowString()

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
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllPage() {
    const ids = pageRows.map((r) => r.id)
    const allSelected = ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  function handleExport() {
    const count = selectedIds.size > 0 ? selectedIds.size : filtered.length
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

  return (
    <div className="space-y-4" data-anno="purchase-order-list">
      <div>
        <p className="text-sm text-muted-foreground">采购管理 / 采购订单</p>
        <h2 className="text-xl font-semibold tracking-tight">采购订单</h2>
      </div>

      <div className="flex flex-wrap gap-1 border-b pb-1" data-anno="purchase-order-tabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`rounded-t-lg px-3 py-2 text-sm ${
              tab === t.key
                ? 'border border-b-0 bg-card font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => {
              setTab(t.key)
              setPage(1)
            }}
          >
            {t.label} {tabCountLabel(tabCounts[t.key])}
          </button>
        ))}
      </div>

      <section className="rounded-xl border bg-card p-4" data-anno="purchase-order-filters">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">采购单号</span>
            <textarea
              className="min-h-9 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="多个单号换行或逗号分隔"
              rows={1}
              value={filters.orderNos}
              onChange={(e) => setFilters((f) => ({ ...f, orderNos: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">供应商</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm"
              value={filters.supplierId}
              onChange={(e) => setFilters((f) => ({ ...f, supplierId: e.target.value }))}
            >
              <option value="">全部</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {partnerLabel(s.supplierCode, s.supplierName)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">入库仓库</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm"
              value={filters.warehouseId}
              onChange={(e) => setFilters((f) => ({ ...f, warehouseId: e.target.value }))}
            >
              <option value="">全部</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {partnerLabel(w.warehouseCode, w.warehouseName)}
                </option>
              ))}
            </select>
          </label>
          {tab === 'ALL' ? (
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">订单状态</span>
              <select
                className="h-9 rounded-lg border bg-background px-3 text-sm"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: e.target.value as PurchaseOrderListFilters['status'],
                  }))
                }
              >
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">下单日期起</span>
            <input
              type="date"
              className="h-9 rounded-lg border bg-background px-3 text-sm"
              value={filters.orderDateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, orderDateFrom: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">下单日期止</span>
            <input
              type="date"
              className="h-9 rounded-lg border bg-background px-3 text-sm"
              value={filters.orderDateTo}
              onChange={(e) => setFilters((f) => ({ ...f, orderDateTo: e.target.value }))}
            />
          </label>
          {expanded ? (
            <>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">预计到货起</span>
                <input
                  type="date"
                  className="h-9 rounded-lg border bg-background px-3 text-sm"
                  value={filters.expectedDateFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, expectedDateFrom: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">预计到货止</span>
                <input
                  type="date"
                  className="h-9 rounded-lg border bg-background px-3 text-sm"
                  value={filters.expectedDateTo}
                  onChange={(e) => setFilters((f) => ({ ...f, expectedDateTo: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">最后修改起</span>
                <input
                  type="date"
                  className="h-9 rounded-lg border bg-background px-3 text-sm"
                  value={filters.updatedFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, updatedFrom: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">最后修改止</span>
                <input
                  type="date"
                  className="h-9 rounded-lg border bg-background px-3 text-sm"
                  value={filters.updatedTo}
                  onChange={(e) => setFilters((f) => ({ ...f, updatedTo: e.target.value }))}
                />
              </label>
            </>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((e) => !e)}>
            {expanded ? '收起' : '展开'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            重置
          </Button>
          <Button type="button" size="sm" onClick={handleSearch}>
            搜索
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button type="button" onClick={() => navigate('/purchase/orders/new')}>
            新增
          </Button>
          <Button type="button" variant="outline" onClick={handleExport}>
            导出
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border bg-card" data-anno="purchase-order-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="sticky left-0 z-10 bg-muted/40 px-2 py-2.5 w-12">
                  <input
                    type="checkbox"
                    checked={pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id))}
                    onChange={toggleAllPage}
                  />
                </th>
                <th className="sticky left-12 z-10 bg-muted/40 px-3 py-2.5 font-medium">采购单号</th>
                <th className="px-3 py-2.5 font-medium">订单状态</th>
                <th className="px-3 py-2.5 font-medium">供应商</th>
                <th className="px-3 py-2.5 font-medium">入库仓库</th>
                <th className="px-3 py-2.5 font-medium">下单日期</th>
                <th className="px-3 py-2.5 font-medium">预计到货日期</th>
                <th className="px-3 py-2.5 font-medium">商品种数</th>
                <th className="px-3 py-2.5 font-medium">采购总金额</th>
                <th className="px-3 py-2.5 font-medium">最后修改时间</th>
                <th className="sticky right-0 bg-muted/40 px-3 py-2.5 font-medium shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/20">
                    <td className="sticky left-0 bg-card px-2 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                    <td className="sticky left-12 bg-card px-3 py-2.5 font-mono text-xs">
                      <Link
                        to={`/purchase/orders/${row.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {row.orderNo}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <PurchaseOrderStatusTag status={row.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      {partnerLabel(row.supplierCode, row.supplierName)}
                    </td>
                    <td className="px-3 py-2.5">
                      {partnerLabel(row.warehouseCode, row.warehouseName)}
                    </td>
                    <td className="px-3 py-2.5">{row.orderDate}</td>
                    <td className="px-3 py-2.5">{row.expectedArrivalDate ?? '-'}</td>
                    <td className="px-3 py-2.5">{row.skuCount} 种</td>
                    <td className="px-3 py-2.5 text-right">{formatYuan(row.totalAmount)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(row.updatedAt)}
                    </td>
                    <td className="sticky right-0 bg-card px-3 py-2.5 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                      <RowActions row={row} onConfirm={openConfirm} onInbound={createInbound} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            共 {filtered.length} 条，第 {pageSafe} / {totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <select
              className="h-8 rounded border bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
            >
              {[20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} 条/页
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(confirmTarget && confirmAction)}
        title={confirmAction ? confirmCopy[confirmAction].title : ''}
        confirmLabel={confirmAction ? confirmCopy[confirmAction].ok : '确认'}
        confirmVariant={confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'}
        onClose={closeConfirm}
        onConfirm={runConfirm}
      >
        <p className="text-sm text-muted-foreground">
          {confirmAction ? confirmCopy[confirmAction].body : ''}
        </p>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

function RowActions({
  row,
  onConfirm,
  onInbound,
}: {
  row: PurchaseOrder
  onConfirm: (order: PurchaseOrder, action: ConfirmAction) => void
  onInbound: (order: PurchaseOrder) => void
}) {
  const s = row.status
  const link = (label: string, to: string) => (
    <Link to={to} className="text-primary hover:underline">
      {label}
    </Link>
  )
  const btn = (label: string, action: ConfirmAction) => (
    <button
      type="button"
      className={action === 'delete' || action === 'void' ? 'text-destructive hover:underline' : 'text-primary hover:underline'}
      onClick={() => onConfirm(row, action)}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
      {link('查看', `/purchase/orders/${row.id}`)}
      {s === 'DRAFT' && (
        <>
          {link('编辑', `/purchase/orders/${row.id}/edit`)}
          {btn('提交审核', 'submit')}
          {btn('删除', 'delete')}
        </>
      )}
      {s === 'PENDING_AUDIT' && (
        <>
          {btn('审核', 'approve')}
          {btn('驳回', 'reject')}
          {btn('作废', 'void')}
        </>
      )}
      {s === 'PENDING_STOCK_IN' && (
        <>
          <button type="button" className="text-primary hover:underline" onClick={() => onInbound(row)}>
            创建入库单
          </button>
          {btn('作废', 'void')}
        </>
      )}
      {s === 'PARTIAL_STOCK_IN' && (
        <>
          <button type="button" className="text-primary hover:underline" onClick={() => onInbound(row)}>
            创建入库单
          </button>
          {btn('关闭订单', 'close')}
        </>
      )}
    </div>
  )
}
