import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { formatDateTime } from '@/features/products/format'
import {
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
  warehouseTypeLabel,
} from '@/features/warehouses/constants'
import {
  getMockInventoryQty,
  listWarehouses,
  persistWarehouses,
} from '@/features/warehouses/storage'
import type { Warehouse, WarehouseListFilters, WarehouseStatus } from '@/features/warehouses/types'

const PAGE_SIZE = 10

const defaultFilters: WarehouseListFilters = {
  keyword: '',
  warehouseType: '',
  status: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function WarehouseList() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<WarehouseListFilters>(defaultFilters)
  const [applied, setApplied] = useState<WarehouseListFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Warehouse | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allWarehouses = useMemo(() => {
    void refreshKey
    return listWarehouses()
  }, [refreshKey])

  const filtered = useMemo(() => {
    const kw = applied.keyword.trim().toLowerCase()
    return allWarehouses.filter((w) => {
      if (applied.warehouseType && w.warehouseType !== applied.warehouseType) return false
      if (applied.status && w.status !== applied.status) return false
      if (!kw) return true
      const hay = [w.warehouseCode, w.warehouseName, w.managerName].join(' ').toLowerCase()
      return hay.includes(kw)
    })
  }, [allWarehouses, applied])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  function handleSearch() {
    setApplied({ ...filters })
    setPage(1)
  }

  function handleReset() {
    setFilters(defaultFilters)
    setApplied(defaultFilters)
    setPage(1)
  }

  function tryOpenDisable(warehouse: Warehouse) {
    const qty = getMockInventoryQty(warehouse.id)
    if (qty > 0) {
      setToast('当前仓库仍有库存，请先处理后再停用')
      return
    }
    setStatusTarget(warehouse)
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function openEnable(warehouse: Warehouse) {
    setStatusTarget(warehouse)
    setStatusAction('enable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function closeStatusModal() {
    setStatusTarget(null)
    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
  }

  function confirmStatusChange() {
    if (!statusTarget || !statusAction) return

    if (statusAction === 'disable') {
      const qty = getMockInventoryQty(statusTarget.id)
      if (qty > 0) {
        setToast('当前仓库仍有库存，请先处理后再停用')
        return
      }
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      if (reason.length > 200) {
        setDisableReasonError('停用原因最多 200 个字符')
        return
      }
      const ts = nowString()
      persistWarehouses(
        allWarehouses.map((w) =>
          w.id === statusTarget.id
            ? {
                ...w,
                status: 'DISABLED' as WarehouseStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: ts,
                disabledBy: '管理员',
                disabledAt: ts,
              }
            : w,
        ),
      )
      setToast('仓库已停用')
    } else {
      const ts = nowString()
      persistWarehouses(
        allWarehouses.map((w) =>
          w.id === statusTarget.id
            ? {
                ...w,
                status: 'ENABLED' as WarehouseStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: ts,
                enabledBy: '管理员',
                enabledAt: ts,
              }
            : w,
        ),
      )
      setToast('仓库已启用')
    }

    closeStatusModal()
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-4" data-anno="warehouse-list-page">
      <div className="flex flex-wrap items-center justify-between gap-3" data-anno="warehouse-list-toolbar">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">仓库管理</h2>
          <p className="text-sm text-muted-foreground">维护仓库档案与启停用状态</p>
        </div>
        <Button type="button" onClick={() => navigate('/master/warehouses/new')}>
          新增仓库
        </Button>
      </div>

      <section className="rounded-xl border bg-card p-4" data-anno="warehouse-list-filters">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">综合搜索</span>
            <input
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="仓库编码 / 仓库名称 / 负责人"
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">仓库类型</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={filters.warehouseType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  warehouseType: e.target.value as WarehouseListFilters['warehouseType'],
                }))
              }
            >
              {TYPE_FILTER_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">状态</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as WarehouseListFilters['status'],
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
        </div>
        <div className="mt-3 flex gap-2">
          <Button type="button" onClick={handleSearch}>
            查询
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            重置
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card" data-anno="warehouse-list-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">仓库编码</th>
                <th className="px-3 py-2.5 font-medium">仓库名称</th>
                <th className="px-3 py-2.5 font-medium">仓库类型</th>
                <th className="px-3 py-2.5 font-medium">负责人</th>
                <th className="px-3 py-2.5 font-medium">状态</th>
                <th className="px-3 py-2.5 font-medium">最后修改时间</th>
                <th className="sticky right-0 bg-muted/40 px-3 py-2.5 font-medium shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    暂无仓库数据
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-mono text-xs">{row.warehouseCode}</td>
                    <td className="px-3 py-2.5">{row.warehouseName}</td>
                    <td className="px-3 py-2.5">{warehouseTypeLabel(row.warehouseType)}</td>
                    <td className="px-3 py-2.5">{row.managerName}</td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(row.updatedAt)}
                    </td>
                    <td className="sticky right-0 bg-card px-3 py-2.5 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link
                          to={`/master/warehouses/${row.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          查看
                        </Link>
                        <Link
                          to={`/master/warehouses/${row.id}/edit`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          编辑
                        </Link>
                        {row.status === 'ENABLED' ? (
                          <button
                            type="button"
                            className="text-destructive hover:underline"
                            onClick={() => tryOpenDisable(row)}
                          >
                            停用
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => openEnable(row)}
                          >
                            启用
                          </button>
                        )}
                      </div>
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
          <div className="flex gap-2">
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
        dataAnno="warehouse-status-modal"
        open={Boolean(statusTarget && statusAction)}
        title={statusAction === 'disable' ? '确认停用仓库？' : '确认启用仓库？'}
        confirmLabel={statusAction === 'disable' ? '确认停用' : '确认启用'}
        confirmVariant={statusAction === 'disable' ? 'destructive' : 'default'}
        onClose={closeStatusModal}
        onConfirm={confirmStatusChange}
      >
        {statusAction === 'disable' ? (
          <label className="grid gap-1 text-sm">
            <span>
              停用原因 <span className="text-destructive">*</span>
            </span>
            <textarea
              className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              maxLength={200}
              value={disableReason}
              onChange={(e) => {
                setDisableReason(e.target.value)
                if (disableReasonError) setDisableReasonError('')
              }}
              aria-invalid={Boolean(disableReasonError)}
            />
            {disableReasonError ? (
              <span className="text-xs text-destructive">{disableReasonError}</span>
            ) : null}
          </label>
        ) : (
          <p className="text-sm text-muted-foreground">启用后仓库可再次被业务单据引用。</p>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
