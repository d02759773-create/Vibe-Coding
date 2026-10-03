import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import {
  SETTLEMENT_FILTER_OPTIONS,
  settlementLabel,
  STATUS_FILTER_OPTIONS,
} from '@/features/suppliers/constants'
import { displayValue } from '@/features/products/format'
import { listSuppliers, persistSuppliers } from '@/features/suppliers/storage'
import type { Supplier, SupplierListFilters, SupplierStatus } from '@/features/suppliers/types'

const PAGE_SIZE = 10

const defaultFilters: SupplierListFilters = {
  keyword: '',
  settlementMethod: '',
  status: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function SupplierList() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<SupplierListFilters>(defaultFilters)
  const [applied, setApplied] = useState<SupplierListFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Supplier | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allSuppliers = useMemo(() => {
    void refreshKey
    return listSuppliers()
  }, [refreshKey])

  const filtered = useMemo(() => {
    const kw = applied.keyword.trim().toLowerCase()
    return allSuppliers.filter((s) => {
      if (applied.settlementMethod && s.settlementMethod !== applied.settlementMethod) return false
      if (applied.status && s.status !== applied.status) return false
      if (!kw) return true
      const hay = [s.supplierCode, s.supplierName, s.contactName].join(' ').toLowerCase()
      return hay.includes(kw)
    })
  }, [allSuppliers, applied])

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

  function openStatusModal(supplier: Supplier, action: 'enable' | 'disable') {
    setStatusTarget(supplier)
    setStatusAction(action)
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
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      if (reason.length > 100) {
        setDisableReasonError('停用原因最多 100 个字符')
        return
      }
      persistSuppliers(
        allSuppliers.map((s) =>
          s.id === statusTarget.id
            ? {
                ...s,
                status: 'DISABLED' as SupplierStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : s,
        ),
      )
      setToast('供应商已停用')
    } else {
      persistSuppliers(
        allSuppliers.map((s) =>
          s.id === statusTarget.id
            ? {
                ...s,
                status: 'ENABLED' as SupplierStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : s,
        ),
      )
      setToast('供应商已启用')
    }

    closeStatusModal()
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">供应商管理</h2>
          <p className="text-sm text-muted-foreground">查询、维护供应商档案与结算规则</p>
        </div>
        <Button type="button" onClick={() => navigate('/master/suppliers/new')}>
          新增供应商
        </Button>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">综合搜索</span>
            <input
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="供应商编码 / 名称 / 联系人"
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">结算方式</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={filters.settlementMethod}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  settlementMethod: e.target.value as SupplierListFilters['settlementMethod'],
                }))
              }
            >
              {SETTLEMENT_FILTER_OPTIONS.map((o) => (
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
                  status: e.target.value as SupplierListFilters['status'],
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

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">供应商编码</th>
                <th className="px-3 py-2.5 font-medium">供应商名称</th>
                <th className="px-3 py-2.5 font-medium">联系人</th>
                <th className="px-3 py-2.5 font-medium">联系电话</th>
                <th className="px-3 py-2.5 font-medium">结算方式</th>
                <th className="px-3 py-2.5 font-medium">账期天数</th>
                <th className="px-3 py-2.5 font-medium">税率</th>
                <th className="px-3 py-2.5 font-medium">状态</th>
                <th className="sticky right-0 bg-muted/40 px-3 py-2.5 font-medium shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-mono text-xs">{row.supplierCode}</td>
                    <td className="px-3 py-2.5">{row.supplierName}</td>
                    <td className="px-3 py-2.5">{row.contactName}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{row.contactPhone}</td>
                    <td className="px-3 py-2.5">{settlementLabel(row.settlementMethod)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.paymentTermDays}</td>
                    <td className="px-3 py-2.5">{displayValue(row.taxRate)}</td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="sticky right-0 bg-card px-3 py-2.5 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link
                          to={`/master/suppliers/${row.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          查看
                        </Link>
                        <Link
                          to={`/master/suppliers/${row.id}/edit`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          编辑
                        </Link>
                        {row.status === 'ENABLED' ? (
                          <button
                            type="button"
                            className="text-destructive hover:underline"
                            onClick={() => openStatusModal(row, 'disable')}
                          >
                            停用
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => openStatusModal(row, 'enable')}
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
        open={Boolean(statusTarget && statusAction)}
        title={statusAction === 'disable' ? '确认停用供应商？' : '确认启用供应商？'}
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
              maxLength={100}
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
          <p className="text-sm text-muted-foreground">
            启用后供应商可再次被采购等业务单据引用。
          </p>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
