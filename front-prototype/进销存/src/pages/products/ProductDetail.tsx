import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { salesUnitLabel } from '@/features/products/constants'
import { displayValue, formatDateTime, formatMoney } from '@/features/products/format'
import {
  getProductById,
  listProducts,
  persistProducts,
} from '@/features/products/storage'
import type { ProductStatus } from '@/features/products/types'

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

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const product = useMemo(() => {
    void refreshKey
    return id ? getProductById(id) : undefined
  }, [id, refreshKey])

  if (!product) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到商品档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
          返回列表
        </Button>
      </div>
    )
  }

  function confirmStatusChange() {
    if (!statusAction || !product) return
    const current = product
    const all = listProducts()

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
      persistProducts(
        all.map((p) =>
          p.id === current.id
            ? {
                ...p,
                status: 'DISABLED' as ProductStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : p,
        ),
      )
      setToast('商品已停用')
    } else {
      persistProducts(
        all.map((p) =>
          p.id === current.id
            ? {
                ...p,
                status: 'ENABLED' as ProductStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : p,
        ),
      )
      setToast('商品已启用')
    }

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  const disableReasonDisplay =
    product.status === 'DISABLED' ? displayValue(product.disableReason) : '-'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">商品详情</h2>
            <StatusPill status={product.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{product.productCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
            返回列表
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/master/products/${product.id}/edit`)}
          >
            编辑
          </Button>
          {product.status === 'ENABLED' ? (
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
        <Section title="基础资料">
          <FieldRow label="商品编码" value={product.productCode} />
          <FieldRow label="商品名称" value={product.productName} />
          <FieldRow label="商品分类" value={product.category} />
          <FieldRow label="规格型号" value={product.specModel} />
          <FieldRow label="销售单位" value={salesUnitLabel(product.salesUnit)} />
          <FieldRow label="条码" value={displayValue(product.barcode)} />
        </Section>

        <Section title="价格与说明">
          <FieldRow label="默认零售价" value={formatMoney(product.defaultRetailPrice)} />
          <FieldRow label="默认批发价" value={formatMoney(product.defaultWholesalePrice)} />
          <FieldRow
            label="参考采购价"
            value={formatMoney(product.referencePurchasePrice)}
          />
          <FieldRow label="商品备注" value={displayValue(product.remark)} />
        </Section>

        <Section title="补充信息">
          <FieldRow label="停用原因" value={disableReasonDisplay} />
        </Section>

        <Section title="系统信息">
          <FieldRow label="创建人" value={product.createdBy} />
          <FieldRow label="创建时间" value={formatDateTime(product.createdAt)} />
          <FieldRow label="最后修改人" value={product.updatedBy} />
          <FieldRow label="最后修改时间" value={formatDateTime(product.updatedAt)} />
        </Section>
      </div>

      <Modal
        open={statusAction !== null}
        title={statusAction === 'disable' ? '确认停用商品？' : '确认启用商品？'}
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
          <p className="text-sm text-muted-foreground">启用后商品可再次被下游单据引用。</p>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
