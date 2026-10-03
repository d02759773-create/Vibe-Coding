import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import {
  PRODUCT_CATEGORIES,
  SALES_UNIT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from '@/features/products/constants'
import { formatDateTime, formatMoney } from '@/features/products/format'
import {
  listProducts,
  persistProducts,
} from '@/features/products/storage'
import type { Product, ProductListFilters, ProductStatus } from '@/features/products/types'

const PAGE_SIZE = 10

const defaultFilters: ProductListFilters = {
  keyword: '',
  category: '',
  status: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function ProductList() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ProductListFilters>(defaultFilters)
  const [applied, setApplied] = useState<ProductListFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Product | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allProducts = useMemo(() => {
    void refreshKey
    return listProducts()
  }, [refreshKey])

  const filtered = useMemo(() => {
    const kw = applied.keyword.trim().toLowerCase()
    return allProducts.filter((p) => {
      if (applied.category && p.category !== applied.category) return false
      if (applied.status && p.status !== applied.status) return false
      if (!kw) return true
      const hay = [p.productCode, p.productName, p.barcode ?? ''].join(' ').toLowerCase()
      return hay.includes(kw)
    })
  }, [allProducts, applied])

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

  function openStatusModal(product: Product, action: 'enable' | 'disable') {
    setStatusTarget(product)
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
      const next = allProducts.map((p) =>
        p.id === statusTarget.id
          ? {
              ...p,
              status: 'DISABLED' as ProductStatus,
              disableReason: reason,
              updatedBy: '管理员',
              updatedAt: nowString(),
            }
          : p,
      )
      persistProducts(next)
      setToast('商品已停用')
    } else {
      const next = allProducts.map((p) =>
        p.id === statusTarget.id
          ? {
              ...p,
              status: 'ENABLED' as ProductStatus,
              disableReason: null,
              updatedBy: '管理员',
              updatedAt: nowString(),
            }
          : p,
      )
      persistProducts(next)
      setToast('商品已启用')
    }

    closeStatusModal()
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">商品管理</h2>
          <p className="text-sm text-muted-foreground">查询、维护商品档案与启停用状态</p>
        </div>
        <Button type="button" onClick={() => navigate('/master/products/new')}>
          新增商品
        </Button>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">综合搜索</span>
            <input
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="商品编码 / 商品名称 / 条码"
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">商品分类</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">全部</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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
                  status: e.target.value as ProductListFilters['status'],
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
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">商品编码</th>
                <th className="px-3 py-2.5 font-medium">商品名称</th>
                <th className="px-3 py-2.5 font-medium">商品分类</th>
                <th className="px-3 py-2.5 font-medium">规格型号</th>
                <th className="px-3 py-2.5 font-medium">销售单位</th>
                <th className="px-3 py-2.5 text-right font-medium">默认批发价</th>
                <th className="px-3 py-2.5 text-right font-medium">默认零售价</th>
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
                  <td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-mono text-xs">{row.productCode}</td>
                    <td className="px-3 py-2.5">{row.productName}</td>
                    <td className="px-3 py-2.5">{row.category}</td>
                    <td className="px-3 py-2.5">{row.specModel}</td>
                    <td className="px-3 py-2.5">
                      {SALES_UNIT_OPTIONS.find((u) => u.value === row.salesUnit)?.label}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatMoney(row.defaultWholesalePrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatMoney(row.defaultRetailPrice)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(row.updatedAt)}
                    </td>
                    <td className="sticky right-0 bg-card px-3 py-2.5 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                      <div className="flex flex-wrap gap-1">
                        <Link
                          to={`/master/products/${row.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          查看
                        </Link>
                        <Link
                          to={`/master/products/${row.id}/edit`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          编辑
                        </Link>
                        {row.status === 'ENABLED' ? (
                          <Button
                            variant="link"
                            className="h-auto px-1 text-destructive"
                            onClick={() => openStatusModal(row, 'disable')}
                          >
                            停用
                          </Button>
                        ) : (
                          <Button
                            variant="link"
                            className="h-auto px-1"
                            onClick={() => openStatusModal(row, 'enable')}
                          >
                            启用
                          </Button>
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
        title={statusAction === 'disable' ? '确认停用商品？' : '确认启用商品？'}
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
              className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive"
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
            启用后商品可再次被下游单据引用。
          </p>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
