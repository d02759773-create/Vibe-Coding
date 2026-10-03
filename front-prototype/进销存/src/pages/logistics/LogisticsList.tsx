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
  displayServiceProvider,
  logisticsTypeLabel,
} from '@/features/logistics/constants'
import { listLogistics, persistLogistics, getMockOpenOutboundCount } from '@/features/logistics/storage'
import type { Logistics, LogisticsListFilters, LogisticsStatus } from '@/features/logistics/types'

const PAGE_SIZE = 10

const defaultFilters: LogisticsListFilters = {
  logisticsCode: '',
  logisticsName: '',
  logisticsType: '',
  serviceProvider: '',
  status: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function contains(hay: string, needle: string): boolean {
  const n = needle.trim().toLowerCase()
  if (!n) return true
  return hay.toLowerCase().includes(n)
}

export function LogisticsList() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<LogisticsListFilters>(defaultFilters)
  const [applied, setApplied] = useState<LogisticsListFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Logistics | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allItems = useMemo(() => {
    void refreshKey
    return listLogistics()
  }, [refreshKey])

  const filtered = useMemo(() => {
    return allItems.filter((row) => {
      if (applied.logisticsType && row.logisticsType !== applied.logisticsType) return false
      if (applied.status && row.status !== applied.status) return false
      if (!contains(row.logisticsCode, applied.logisticsCode)) return false
      if (!contains(row.logisticsName, applied.logisticsName)) return false
      if (!contains(row.serviceProvider ?? '', applied.serviceProvider)) return false
      return true
    })
  }, [allItems, applied])

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

  function openDisable(row: Logistics) {
    if (getMockOpenOutboundCount(row.id) > 0) {
      setToast('存在未完结的销售出库单引用该物流方式，请先处理后再禁用')
      return
    }
    setStatusTarget(row)
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function openEnable(row: Logistics) {
    setStatusTarget(row)
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
      if (getMockOpenOutboundCount(statusTarget.id) > 0) {
        setToast('存在未完结的销售出库单引用该物流方式，请先处理后再禁用')
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
      persistLogistics(
        allItems.map((row) =>
          row.id === statusTarget.id
            ? {
                ...row,
                status: 'DISABLED' as LogisticsStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: ts,
                disabledBy: '管理员',
                disabledAt: ts,
              }
            : row,
        ),
      )
      setToast('物流方式已禁用')
    } else {
      const ts = nowString()
      persistLogistics(
        allItems.map((row) =>
          row.id === statusTarget.id
            ? {
                ...row,
                status: 'ENABLED' as LogisticsStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: ts,
                enabledBy: '管理员',
                enabledAt: ts,
              }
            : row,
        ),
      )
      setToast('物流方式已启用')
    }

    closeStatusModal()
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-4" data-anno="logistics-list-page">
      <div className="flex flex-wrap items-center justify-between gap-3" data-anno="logistics-list-toolbar">
        <div>
          <p className="text-sm text-muted-foreground">基础资料 / 物流管理</p>
          <h2 className="text-xl font-semibold tracking-tight">物流管理</h2>
          <p className="text-sm text-muted-foreground">维护物流方式与使用状态</p>
        </div>
        <Button type="button" onClick={() => navigate('/master/logistics/new')}>
          新增
        </Button>
      </div>

      <section className="rounded-xl border bg-card p-4" data-anno="logistics-list-filters">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">物流编码</span>
            <input
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="请输入"
              value={filters.logisticsCode}
              onChange={(e) => setFilters((f) => ({ ...f, logisticsCode: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">物流名称</span>
            <input
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="请输入"
              value={filters.logisticsName}
              onChange={(e) => setFilters((f) => ({ ...f, logisticsName: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">物流类型</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={filters.logisticsType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  logisticsType: e.target.value as LogisticsListFilters['logisticsType'],
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
            <span className="text-muted-foreground">物流服务商</span>
            <input
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="请输入"
              value={filters.serviceProvider}
              onChange={(e) => setFilters((f) => ({ ...f, serviceProvider: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">使用状态</span>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as LogisticsListFilters['status'],
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
          <Button type="button" variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button type="button" onClick={handleSearch}>
            搜索
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card" data-anno="logistics-list-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">物流编码</th>
                <th className="px-3 py-2.5 font-medium">物流名称</th>
                <th className="px-3 py-2.5 font-medium">物流类型</th>
                <th className="px-3 py-2.5 font-medium">物流服务商</th>
                <th className="px-3 py-2.5 font-medium">使用状态</th>
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
                    暂无物流数据
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-mono text-xs">
                      <Link
                        to={`/master/logistics/${row.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {row.logisticsCode}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">{row.logisticsName}</td>
                    <td className="px-3 py-2.5">{logisticsTypeLabel(row.logisticsType)}</td>
                    <td className="px-3 py-2.5">{displayServiceProvider(row.serviceProvider)}</td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={row.status} disabledLabel="禁用" />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(row.updatedAt)}
                    </td>
                    <td className="sticky right-0 bg-card px-3 py-2.5 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link
                          to={`/master/logistics/${row.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          查看
                        </Link>
                        <Link
                          to={`/master/logistics/${row.id}/edit`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          编辑
                        </Link>
                        {row.status === 'ENABLED' ? (
                          <button
                            type="button"
                            className="text-destructive hover:underline"
                            onClick={() => openDisable(row)}
                          >
                            禁用
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
        dataAnno="logistics-status-modal"
        open={Boolean(statusTarget && statusAction)}
        title={statusAction === 'disable' ? '确认禁用物流方式？' : '确认启用物流方式？'}
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
          <p className="text-sm text-muted-foreground">启用后该物流方式可再次被业务单据引用。</p>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
