import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { displayValue, formatDateTime } from '@/features/products/format'
import { settlementLabel } from '@/features/suppliers/constants'
import {
  getSupplierById,
  listSuppliers,
  persistSuppliers,
} from '@/features/suppliers/storage'
import type { SupplierStatus } from '@/features/suppliers/types'

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

export function SupplierDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const supplier = useMemo(() => {
    void refreshKey
    return id ? getSupplierById(id) : undefined
  }, [id, refreshKey])

  if (!supplier) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到供应商档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
          返回列表
        </Button>
      </div>
    )
  }

  function confirmStatusChange() {
    if (!statusAction || !supplier) return
    const current = supplier
    const all = listSuppliers()

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
        all.map((s) =>
          s.id === current.id
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
        all.map((s) =>
          s.id === current.id
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

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  const disableReasonDisplay =
    supplier.status === 'DISABLED' ? displayValue(supplier.disableReason) : '-'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">供应商详情</h2>
            <StatusPill status={supplier.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{supplier.supplierCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
            返回列表
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/master/suppliers/${supplier.id}/edit`)}
          >
            编辑
          </Button>
          {supplier.status === 'ENABLED' ? (
            <Button type="button" variant="destructive" onClick={() => setStatusAction('disable')}>
              停用
            </Button>
          ) : (
            <Button type="button" onClick={() => setStatusAction('enable')}>
              启用
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="供应商资料">
          <FieldRow label="供应商编码" value={supplier.supplierCode} />
          <FieldRow label="供应商名称" value={supplier.supplierName} />
          <FieldRow label="联系人" value={supplier.contactName} />
          <FieldRow label="联系电话" value={supplier.contactPhone} />
          <FieldRow label="联系地址" value={displayValue(supplier.contactAddress)} />
        </Section>

        <Section title="结算规则">
          <FieldRow label="结算方式" value={settlementLabel(supplier.settlementMethod)} />
          <FieldRow label="账期天数" value={supplier.paymentTermDays} />
          <FieldRow label="税率" value={displayValue(supplier.taxRate)} />
          <FieldRow label="供应商备注" value={displayValue(supplier.remark)} />
        </Section>

        <Section title="补充信息">
          <FieldRow label="停用原因" value={disableReasonDisplay} />
        </Section>

        <Section title="系统信息">
          <FieldRow label="创建人" value={supplier.createdBy} />
          <FieldRow label="创建时间" value={formatDateTime(supplier.createdAt)} />
          <FieldRow label="最后修改人" value={supplier.updatedBy} />
          <FieldRow label="最后修改时间" value={formatDateTime(supplier.updatedAt)} />
        </Section>
      </div>

      <Modal
        open={statusAction !== null}
        title={statusAction === 'disable' ? '确认停用供应商？' : '确认启用供应商？'}
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
          <p className="text-sm text-muted-foreground">启用后供应商可再次被采购等业务单据引用。</p>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
