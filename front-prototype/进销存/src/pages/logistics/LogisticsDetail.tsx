import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { displayValue, formatDateTime } from '@/features/products/format'
import {
  displayServiceProvider,
  logisticsTypeLabel,
} from '@/features/logistics/constants'
import {
  getLogisticsById,
  getMockOpenOutboundCount,
  listLogistics,
  persistLogistics,
} from '@/features/logistics/storage'
import type { LogisticsStatus } from '@/features/logistics/types'

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-dashed py-3 last:border-b-0 sm:grid-cols-[140px_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card">
      <h3 className="border-b px-4 py-3 text-sm font-semibold">{title}</h3>
      <dl className="px-4">{children}</dl>
    </section>
  )
}

export function LogisticsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const item = useMemo(() => {
    void refreshKey
    return id ? getLogisticsById(id) : undefined
  }, [id, refreshKey])

  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到物流档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/logistics')}>
          返回列表
        </Button>
      </div>
    )
  }

  function confirmStatusChange() {
    if (!statusAction || !item) return
    const current = item
    const all = listLogistics()

    if (statusAction === 'disable') {
      if (getMockOpenOutboundCount(current.id) > 0) {
        setToast('存在未完结的销售出库单引用该物流方式，请先处理后再禁用')
        return
      }
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      const ts = nowString()
      persistLogistics(
        all.map((row) =>
          row.id === current.id
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
        all.map((row) =>
          row.id === current.id
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

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4" data-anno="logistics-detail-page">
      <div
        className="flex flex-wrap items-center justify-between gap-3"
        data-anno="logistics-detail-actions"
      >
        <div>
          <p className="text-sm text-muted-foreground">基础资料 / 物流管理 / 详情</p>
          <h2 className="text-xl font-semibold tracking-tight">物流详情</h2>
          <p className="text-sm text-muted-foreground">{item.logisticsCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/master/logistics')}>
            返回列表
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/master/logistics/${item.id}/edit`)}>
            编辑
          </Button>
          {item.status === 'ENABLED' ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (getMockOpenOutboundCount(item.id) > 0) {
                  setToast('存在未完结的销售出库单引用该物流方式，请先处理后再禁用')
                  return
                }
                setStatusAction('disable')
              }}
            >
              禁用
            </Button>
          ) : (
            <Button type="button" onClick={() => setStatusAction('enable')}>
              启用
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4" data-anno="logistics-detail-sections">
        <Section title="基础识别信息">
        <FieldRow label="物流编码" value={item.logisticsCode} />
        <FieldRow label="物流名称" value={item.logisticsName} />
        <FieldRow label="物流类型" value={logisticsTypeLabel(item.logisticsType)} />
        <FieldRow label="物流服务商" value={displayServiceProvider(item.serviceProvider)} />
        <FieldRow label="物流备注" value={displayValue(item.remark)} />
        <FieldRow
          label="使用状态"
          value={<StatusPill status={item.status} disabledLabel="禁用" />}
        />
        <FieldRow
          label="停用原因"
          value={item.status === 'DISABLED' ? displayValue(item.disableReason) : '-'}
        />
      </Section>

      <Section title="系统信息">
        <FieldRow label="创建人" value={item.createdBy} />
        <FieldRow label="创建时间" value={formatDateTime(item.createdAt)} />
        <FieldRow label="最后修改人" value={item.updatedBy} />
        <FieldRow label="最后修改时间" value={formatDateTime(item.updatedAt)} />
        <FieldRow label="禁用人" value={displayValue(item.disabledBy)} />
        <FieldRow label="禁用时间" value={item.disabledAt ? formatDateTime(item.disabledAt) : '-'} />
        <FieldRow label="启用人" value={displayValue(item.enabledBy)} />
        <FieldRow label="启用时间" value={item.enabledAt ? formatDateTime(item.enabledAt) : '-'} />
      </Section>
      </div>

      <Modal
        dataAnno="logistics-status-modal"
        open={Boolean(statusAction)}
        title={statusAction === 'disable' ? '确认禁用物流方式？' : '确认启用物流方式？'}
        confirmLabel={statusAction === 'disable' ? '确认禁用' : '确认启用'}
        confirmVariant={statusAction === 'disable' ? 'destructive' : 'default'}
        onClose={() => {
          setStatusAction(null)
          setDisableReason('')
          setDisableReasonError('')
        }}
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
