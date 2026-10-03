import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import {
  customerGradeLabel,
  customerTypeLabel,
  GRADE_FILTER_OPTIONS,
  parseBatchCustomerCodes,
  settlementLabel,
  SETTLEMENT_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from '@/features/customers/constants'
import { getRealtimeReceivable } from '@/features/customers/receivable'
import { listCustomers, persistCustomers } from '@/features/customers/storage'
import type {
  Customer,
  CustomerListFilters,
  CustomerSortField,
  CustomerStatus,
} from '@/features/customers/types'
import { displayValue, formatMoney } from '@/features/products/format'

const PAGE_SIZE = 10

const defaultFilters: CustomerListFilters = {
  customerCode: '',
  customerName: '',
  customerType: '',
  customerGrade: '',
  salesperson: '',
  settlementMethod: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function moneyCell(value: number) {
  return `¥${formatMoney(value)}`
}

export function CustomerList() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<CustomerListFilters>(defaultFilters)
  const [applied, setApplied] = useState<CustomerListFilters>(defaultFilters)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [sortField, setSortField] = useState<CustomerSortField | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const [statusTarget, setStatusTarget] = useState<Customer | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allCustomers = useMemo(() => {
    void refreshKey
    return listCustomers()
  }, [refreshKey])

  const filtered = useMemo(() => {
    const codes = parseBatchCustomerCodes(applied.customerCode)
    const nameKw = applied.customerName.trim().toLowerCase()
    const spKw = applied.salesperson.trim().toLowerCase()

    let rows = allCustomers.filter((c) => {
      if (codes.length > 0 && !codes.includes(c.customerCode)) return false
      if (applied.customerType && c.customerType !== applied.customerType) return false
      if (applied.customerGrade && c.customerGrade !== applied.customerGrade) return false
      if (applied.settlementMethod && c.settlementMethod !== applied.settlementMethod) return false
      if (nameKw && !c.customerName.toLowerCase().includes(nameKw)) return false
      if (spKw) {
        const sp = (c.salesperson ?? '').toLowerCase()
        if (!sp.includes(spKw)) return false
      }
      return true
    })

    if (sortField) {
      rows = [...rows].sort((a, b) => {
        const diff = a[sortField] - b[sortField]
        return sortAsc ? diff : -diff
      })
    }

    return rows
  }, [allCustomers, applied, sortField, sortAsc])

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

  function toggleSort(field: CustomerSortField) {
    if (sortField === field) setSortAsc((v) => !v)
    else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  function tryOpenDisable(customer: Customer) {
    const receivable = getRealtimeReceivable(customer.id)
    if (receivable > 0) {
      setToast('该客户仍有未结清应收，请先收款或对账后再禁用')
      return
    }
    setStatusTarget(customer)
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function openEnable(customer: Customer) {
    setStatusTarget(customer)
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
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      if (reason.length > 200) {
        setDisableReasonError('停用原因最多 200 个字符')
        return
      }
      persistCustomers(
        allCustomers.map((c) =>
          c.id === statusTarget.id
            ? {
                ...c,
                status: 'DISABLED' as CustomerStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : c,
        ),
      )
      setToast('客户已停用')
    } else {
      persistCustomers(
        allCustomers.map((c) =>
          c.id === statusTarget.id
            ? {
                ...c,
                status: 'ENABLED' as CustomerStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : c,
        ),
      )
      setToast('客户已启用')
    }

    closeStatusModal()
    setRefreshKey((k) => k + 1)
  }

  const sortIndicator = (field: CustomerSortField) => {
    if (sortField !== field) return ' ↕'
    return sortAsc ? ' ↑' : ' ↓'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">客户管理</h2>
          <p className="text-sm text-muted-foreground">维护客户档案、结算与信用额度</p>
        </div>
        <Button type="button" onClick={() => navigate('/master/customers/new')}>
          新增
        </Button>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="grid gap-1 text-sm lg:col-span-2">
            <span className="text-muted-foreground">客户编码</span>
            <input
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="可批量，精确匹配"
              value={filters.customerCode}
              onChange={(e) => setFilters((f) => ({ ...f, customerCode: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm lg:col-span-2">
            <span className="text-muted-foreground">客户名称</span>
            <input
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="请输入"
              value={filters.customerName}
              onChange={(e) => setFilters((f) => ({ ...f, customerName: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">客户类型</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={filters.customerType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  customerType: e.target.value as CustomerListFilters['customerType'],
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
            <span className="text-muted-foreground">客户等级</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={filters.customerGrade}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  customerGrade: e.target.value as CustomerListFilters['customerGrade'],
                }))
              }
            >
              {GRADE_FILTER_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {expanded ? (
            <>
              <label className="grid gap-1 text-sm lg:col-span-2">
                <span className="text-muted-foreground">归属业务员</span>
                <input
                  className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder="请输入"
                  value={filters.salesperson}
                  onChange={(e) => setFilters((f) => ({ ...f, salesperson: e.target.value }))}
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
                      settlementMethod: e.target.value as CustomerListFilters['settlementMethod'],
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
            </>
          ) : (
            <>
              <label className="grid gap-1 text-sm lg:col-span-2">
                <span className="text-muted-foreground">归属业务员</span>
                <input
                  className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder="请输入"
                  value={filters.salesperson}
                  onChange={(e) => setFilters((f) => ({ ...f, salesperson: e.target.value }))}
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
                      settlementMethod: e.target.value as CustomerListFilters['settlementMethod'],
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
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? '收起' : '展开'}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button type="button" onClick={handleSearch}>
            搜索
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">客户编码</th>
                <th className="px-3 py-2.5 font-medium">客户名称</th>
                <th className="px-3 py-2.5 font-medium">客户类型</th>
                <th className="px-3 py-2.5 font-medium">客户等级</th>
                <th className="px-3 py-2.5 font-medium">联系人</th>
                <th className="px-3 py-2.5 font-medium">联系电话</th>
                <th className="px-3 py-2.5 font-medium">归属业务员</th>
                <th className="px-3 py-2.5 font-medium">
                  <button
                    type="button"
                    className="font-medium hover:text-foreground"
                    onClick={() => toggleSort('openingArrears')}
                  >
                    期初欠款{sortIndicator('openingArrears')}
                  </button>
                </th>
                <th className="px-3 py-2.5 font-medium">
                  <button
                    type="button"
                    className="font-medium hover:text-foreground"
                    onClick={() => toggleSort('openingBalance')}
                  >
                    期初余额{sortIndicator('openingBalance')}
                  </button>
                </th>
                <th className="px-3 py-2.5 font-medium">结算方式</th>
                <th className="sticky right-0 bg-muted/40 px-3 py-2.5 font-medium shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">
                    暂无客户数据
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/master/customers/${row.id}`}
                        className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                      >
                        {row.customerCode}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">{row.customerName}</td>
                    <td className="px-3 py-2.5">{customerTypeLabel(row.customerType)}</td>
                    <td className="px-3 py-2.5">{customerGradeLabel(row.customerGrade)}</td>
                    <td className="px-3 py-2.5">{row.contactName}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{row.contactPhone}</td>
                    <td className="px-3 py-2.5">{displayValue(row.salesperson)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {moneyCell(row.openingArrears)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {moneyCell(row.openingBalance)}
                    </td>
                    <td className="px-3 py-2.5">{settlementLabel(row.settlementMethod)}</td>
                    <td className="sticky right-0 bg-card px-3 py-2.5 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link
                          to={`/master/customers/${row.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          查看
                        </Link>
                        <Link
                          to={`/master/customers/${row.id}/edit`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          编辑
                        </Link>
                        {row.status === 'ENABLED' ? (
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => tryOpenDisable(row)}
                          >
                            禁用
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-emerald-600 hover:underline"
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
        open={Boolean(statusTarget && statusAction)}
        title={statusAction === 'disable' ? '确认禁用客户？' : '确认启用客户？'}
        confirmLabel={statusAction === 'disable' ? '确认禁用' : '确认启用'}
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
          <p className="text-sm text-muted-foreground">启用后客户可再次被销售等业务单据引用。</p>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
