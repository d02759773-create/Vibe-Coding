import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import {
  customerGradeLabel,
  customerTypeLabel,
  settlementLabel,
} from '@/features/customers/constants'
import { getRealtimeReceivable } from '@/features/customers/receivable'
import {
  getCustomerById,
  listCustomers,
  persistCustomers,
} from '@/features/customers/storage'
import type { CustomerStatus } from '@/features/customers/types'
import { displayValue, formatDateTime, formatMoney } from '@/features/products/format'

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

function moneyDisplay(value: number) {
  return `¥${formatMoney(value)}`
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const customer = useMemo(() => {
    void refreshKey
    return id ? getCustomerById(id) : undefined
  }, [id, refreshKey])

  if (!customer) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到客户档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
          返回列表
        </Button>
      </div>
    )
  }

  const receivable = getRealtimeReceivable(customer.id)
  const fullAddress = [customer.province, customer.city, customer.district, customer.detailAddress]
    .filter(Boolean)
    .join(' ')

  function tryOpenDisable() {
    if (!customer) return
    if (getRealtimeReceivable(customer.id) > 0) {
      setToast('该客户仍有未结清应收，请先收款或对账后再禁用')
      return
    }
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function confirmStatusChange() {
    if (!statusAction || !customer) return
    const current = customer
    const all = listCustomers()

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
        all.map((c) =>
          c.id === current.id
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
        all.map((c) =>
          c.id === current.id
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

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  const disableReasonDisplay =
    customer.status === 'DISABLED' ? displayValue(customer.disableReason) : '-'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">客户详情</h2>
            <StatusPill status={customer.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{customer.customerCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
            返回列表
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/master/customers/${customer.id}/edit`)}
          >
            编辑
          </Button>
          {customer.status === 'ENABLED' ? (
            <Button type="button" variant="destructive" onClick={tryOpenDisable}>
              禁用
            </Button>
          ) : (
            <Button type="button" onClick={() => setStatusAction('enable')}>
              启用
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <Section title="基础识别信息">
          <FieldRow label="客户编码" value={customer.customerCode} />
          <FieldRow label="客户名称" value={customer.customerName} />
          <FieldRow label="客户类型" value={customerTypeLabel(customer.customerType)} />
          <FieldRow label="客户等级" value={customerGradeLabel(customer.customerGrade)} />
          <FieldRow label="联系人" value={customer.contactName} />
          <FieldRow label="联系电话" value={customer.contactPhone} />
          <FieldRow label="省份" value={customer.province} />
          <FieldRow label="城市" value={customer.city} />
          <FieldRow label="区/县" value={customer.district} />
          <FieldRow label="详细地址" value={displayValue(customer.detailAddress)} />
          <FieldRow label="完整地址" value={fullAddress || '-'} />
          <FieldRow label="启停用状态" value={<StatusPill status={customer.status} />} />
        </Section>

        <Section title="经营与结算信息">
          <FieldRow label="归属业务员" value={displayValue(customer.salesperson)} />
          <FieldRow label="期初欠款" value={moneyDisplay(customer.openingArrears)} />
          <FieldRow label="期初余额" value={moneyDisplay(customer.openingBalance)} />
          <FieldRow label="结算方式" value={settlementLabel(customer.settlementMethod)} />
          <FieldRow label="账期天数" value={customer.paymentTermDays} />
          <FieldRow label="信用额度" value={moneyDisplay(customer.creditLimit)} />
          <FieldRow label="客户备注" value={displayValue(customer.remark)} />
          <FieldRow
            label="实时应收余额"
            value={
              <span className="tabular-nums text-muted-foreground">
                {moneyDisplay(receivable)}（往来模块 Demo 计算，非档案存储）
              </span>
            }
          />
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="补充信息">
            <FieldRow label="停用原因" value={disableReasonDisplay} />
          </Section>

          <Section title="系统信息">
            <FieldRow label="创建人" value={customer.createdBy} />
            <FieldRow label="创建时间" value={formatDateTime(customer.createdAt)} />
            <FieldRow label="最后修改人" value={customer.updatedBy} />
            <FieldRow label="最后修改时间" value={formatDateTime(customer.updatedAt)} />
          </Section>
        </div>
      </div>

      <Modal
        open={statusAction !== null}
        title={statusAction === 'disable' ? '确认禁用客户？' : '确认启用客户？'}
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
