import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { displayValue, formatDateTime } from '@/features/products/format'
import { warehouseTypeLabel } from '@/features/warehouses/constants'
import {
  getMockInventoryQty,
  getWarehouseById,
  listWarehouses,
  persistWarehouses,
} from '@/features/warehouses/storage'
import type { WarehouseStatus } from '@/features/warehouses/types'

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

export function WarehouseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const warehouse = useMemo(() => {
    void refreshKey
    return id ? getWarehouseById(id) : undefined
  }, [id, refreshKey])

  if (!warehouse) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到仓库档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
          返回列表
        </Button>
      </div>
    )
  }

  const wh = warehouse

  function tryOpenDisable() {
    if (getMockInventoryQty(wh.id) > 0) {
      setToast('当前仓库仍有库存，请先处理后再停用')
      return
    }
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function confirmStatusChange() {
    if (!statusAction) return
    const all = listWarehouses()

    if (statusAction === 'disable') {
      if (getMockInventoryQty(wh.id) > 0) {
        setToast('当前仓库仍有库存，请先处理后再停用')
        return
      }
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      const ts = nowString()
      persistWarehouses(
        all.map((w) =>
          w.id === wh.id
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
        all.map((w) =>
          w.id === wh.id
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

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  const disableReasonDisplay = wh.status === 'DISABLED' ? displayValue(wh.disableReason) : '-'

  return (
    <div className="space-y-4" data-anno="warehouse-detail-page">
      <div className="flex flex-wrap items-start justify-between gap-3" data-anno="warehouse-detail-actions">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">仓库详情</h2>
            <StatusPill status={wh.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{wh.warehouseCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
            返回列表
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/master/warehouses/${wh.id}/edit`)}
          >
            编辑
          </Button>
          {wh.status === 'ENABLED' ? (
            <Button type="button" variant="destructive" onClick={tryOpenDisable}>
              停用
            </Button>
          ) : (
            <Button type="button" onClick={() => setStatusAction('enable')}>
              启用
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2" data-anno="warehouse-detail-sections">
        <Section title="基础资料">
          <FieldRow label="仓库编码" value={wh.warehouseCode} />
          <FieldRow label="仓库名称" value={wh.warehouseName} />
          <FieldRow label="仓库类型" value={warehouseTypeLabel(wh.warehouseType)} />
          <FieldRow label="启停用状态" value={<StatusPill status={wh.status} />} />
        </Section>

        <Section title="联系信息">
          <FieldRow label="仓库地址" value={wh.address} />
          <FieldRow label="负责人" value={wh.managerName} />
          <FieldRow label="联系电话" value={displayValue(wh.contactPhone)} />
          <FieldRow label="仓库备注" value={displayValue(wh.remark)} />
        </Section>

        <Section title="补充信息">
          <FieldRow label="停用原因" value={disableReasonDisplay} />
        </Section>

        <Section title="系统信息">
          <FieldRow label="创建人" value={wh.createdBy} />
          <FieldRow label="创建时间" value={formatDateTime(wh.createdAt)} />
          <FieldRow label="最后修改人" value={wh.updatedBy} />
          <FieldRow label="最后修改时间" value={formatDateTime(wh.updatedAt)} />
          <FieldRow label="停用人" value={displayValue(wh.disabledBy)} />
          <FieldRow label="停用时间" value={formatDateTime(wh.disabledAt)} />
          <FieldRow label="启用人" value={displayValue(wh.enabledBy)} />
          <FieldRow label="启用时间" value={formatDateTime(wh.enabledAt)} />
        </Section>
      </div>

      <Modal
        dataAnno="warehouse-status-modal"
        open={statusAction !== null}
        title={statusAction === 'disable' ? '确认停用仓库？' : '确认启用仓库？'}
        confirmLabel={statusAction === 'disable' ? '确认停用' : '确认启用'}
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
