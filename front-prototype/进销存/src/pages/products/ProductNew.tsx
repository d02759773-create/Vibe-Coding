import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CODE_MAX_LENGTH,
  PRODUCT_CODE_MIN_LENGTH,
  PRODUCT_CODE_PATTERN,
  SALES_UNIT_OPTIONS,
} from '@/features/products/constants'
import { formatDateTime } from '@/features/products/format'
import {
  getProductByBarcode,
  getProductByCode,
  getProductById,
  nextProductId,
  upsertProduct,
} from '@/features/products/storage'
import type { Product, SalesUnit } from '@/features/products/types'

type FormState = {
  productCode: string
  productName: string
  category: string
  specModel: string
  salesUnit: SalesUnit | ''
  barcode: string
  defaultRetailPrice: string
  defaultWholesalePrice: string
  referencePurchasePrice: string
  remark: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  productCode: '',
  productName: '',
  category: '',
  specModel: '',
  salesUnit: '',
  barcode: '',
  defaultRetailPrice: '',
  defaultWholesalePrice: '',
  referencePurchasePrice: '',
  remark: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function parseOptionalPrice(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  if (Number.isNaN(num) || num < 0) return null
  return Math.round(num * 100) / 100
}

function parseRequiredPrice(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  if (Number.isNaN(num) || num < 0) return null
  return Math.round(num * 100) / 100
}

function productToForm(product: Product): FormState {
  return {
    productCode: product.productCode,
    productName: product.productName,
    category: product.category,
    specModel: product.specModel,
    salesUnit: product.salesUnit,
    barcode: product.barcode ?? '',
    defaultRetailPrice:
      product.defaultRetailPrice === null ? '' : String(product.defaultRetailPrice),
    defaultWholesalePrice: String(product.defaultWholesalePrice),
    referencePurchasePrice:
      product.referencePurchasePrice === null
        ? ''
        : String(product.referencePurchasePrice),
    remark: product.remark ?? '',
  }
}

function inputClass(invalid?: boolean) {
  return [
    'h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    invalid ? 'border-destructive' : '',
  ].join(' ')
}

export function ProductNew() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const existing = useMemo(() => (id ? getProductById(id) : undefined), [id])

  const [form, setForm] = useState<FormState>(() =>
    existing ? productToForm(existing) : emptyForm,
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [codeFormatError, setCodeFormatError] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  if (isEdit && !existing) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到商品档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
          返回列表
        </Button>
      </div>
    )
  }

  const codeReadOnly = isEdit && existing?.isReferenced

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleProductCodeChange(raw: string) {
    const upper = raw.toUpperCase()
    if (!PRODUCT_CODE_PATTERN.test(upper)) {
      setCodeFormatError('商品编码只允许大写字母、数字和连字符（-）')
      return
    }
    setCodeFormatError('')
    if (upper.length > PRODUCT_CODE_MAX_LENGTH) return
    updateField('productCode', upper)
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const code = form.productCode.trim()
    const name = form.productName.trim()

    if (!code) next.productCode = '商品编码不能为空'
    else if (code.length < PRODUCT_CODE_MIN_LENGTH) next.productCode = '商品编码至少 2 个字符'
    else if (!PRODUCT_CODE_PATTERN.test(code)) {
      next.productCode = '商品编码只允许大写字母、数字和连字符（-）'
    } else if (!codeReadOnly) {
      const dup = getProductByCode(code, existing?.id)
      if (dup) next.productCode = '商品编码已存在'
    }

    if (!name) next.productName = '商品名称不能为空'
    else if (name.length > 50) next.productName = '商品名称最多 50 个字符'

    if (!form.category) next.category = '请选择商品分类'
    if (!form.specModel.trim()) next.specModel = '规格型号不能为空'
    else if (form.specModel.trim().length > 100) next.specModel = '规格型号最多 100 个字符'

    if (!form.salesUnit) next.salesUnit = '请选择销售单位'

    const wholesale = parseRequiredPrice(form.defaultWholesalePrice)
    if (wholesale === null) next.defaultWholesalePrice = '默认批发价必填且须 ≥ 0'

    const retail = parseOptionalPrice(form.defaultRetailPrice)
    if (form.defaultRetailPrice.trim() && retail === null) {
      next.defaultRetailPrice = '默认零售价须 ≥ 0，保留 2 位小数'
    }

    const purchase = parseOptionalPrice(form.referencePurchasePrice)
    if (form.referencePurchasePrice.trim() && purchase === null) {
      next.referencePurchasePrice = '参考采购价须 ≥ 0，保留 2 位小数'
    }

    const barcode = form.barcode.trim()
    if (barcode.length > 30) next.barcode = '条码最多 30 个字符'
    else if (barcode) {
      const dup = getProductByBarcode(barcode, existing?.id)
      if (dup) next.barcode = '商品条码已存在'
    }

    if (form.remark.length > 200) next.remark = '商品备注最多 200 个字符'

    return next
  }

  function handleSubmit() {
    if (codeFormatError) return
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const timestamp = nowString()
    const wholesale = parseRequiredPrice(form.defaultWholesalePrice)!
    const retail = parseOptionalPrice(form.defaultRetailPrice)
    const purchase = parseOptionalPrice(form.referencePurchasePrice)

    if (isEdit && existing) {
      upsertProduct({
        ...existing,
        productCode: existing.isReferenced ? existing.productCode : form.productCode.trim(),
        productName: form.productName.trim(),
        category: form.category,
        specModel: form.specModel.trim(),
        salesUnit: form.salesUnit as SalesUnit,
        barcode: form.barcode.trim() || null,
        defaultRetailPrice: retail,
        defaultWholesalePrice: wholesale,
        referencePurchasePrice: purchase,
        remark: form.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertProduct({
        id: nextProductId(),
        productCode: form.productCode.trim(),
        productName: form.productName.trim(),
        category: form.category,
        specModel: form.specModel.trim(),
        salesUnit: form.salesUnit as SalesUnit,
        barcode: form.barcode.trim() || null,
        defaultRetailPrice: retail,
        defaultWholesalePrice: wholesale,
        referencePurchasePrice: purchase,
        remark: form.remark.trim() || null,
        status: 'ENABLED',
        disableReason: null,
        isReferenced: false,
        createdBy: '管理员',
        createdAt: timestamp,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    }

    setToast('保存成功')
    window.setTimeout(() => navigate('/master/products'), 400)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {isEdit ? '编辑商品' : '新增商品'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? '修改商品档案信息' : '创建新的商品档案，保存后默认启用'}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
          取消
        </Button>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">基础资料</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>
                商品编码 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.productCode || codeFormatError))}
                value={form.productCode}
                readOnly={codeReadOnly}
                disabled={codeReadOnly}
                maxLength={PRODUCT_CODE_MAX_LENGTH}
                placeholder="SKU-0001"
                onChange={(e) => handleProductCodeChange(e.target.value)}
              />
              {codeReadOnly ? (
                <span className="text-xs text-muted-foreground">
                  该商品已被业务单据引用，编码不可修改
                </span>
              ) : null}
              {codeFormatError ? (
                <span className="text-xs text-destructive">{codeFormatError}</span>
              ) : null}
              {errors.productCode ? (
                <span className="text-xs text-destructive">{errors.productCode}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>
                商品名称 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.productName))}
                maxLength={50}
                value={form.productName}
                onChange={(e) => updateField('productName', e.target.value)}
              />
              {errors.productName ? (
                <span className="text-xs text-destructive">{errors.productName}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>
                商品分类 <span className="text-destructive">*</span>
              </span>
              <select
                className={inputClass(Boolean(errors.category))}
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
              >
                <option value="">请选择</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <span className="text-xs text-destructive">{errors.category}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>
                销售单位 <span className="text-destructive">*</span>
              </span>
              <select
                className={inputClass(Boolean(errors.salesUnit))}
                value={form.salesUnit}
                onChange={(e) => updateField('salesUnit', e.target.value as SalesUnit | '')}
              >
                <option value="">请选择</option>
                {SALES_UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              {errors.salesUnit ? (
                <span className="text-xs text-destructive">{errors.salesUnit}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>
                规格型号 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.specModel))}
                maxLength={100}
                value={form.specModel}
                onChange={(e) => updateField('specModel', e.target.value)}
              />
              {errors.specModel ? (
                <span className="text-xs text-destructive">{errors.specModel}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>条码</span>
              <input
                className={inputClass(Boolean(errors.barcode))}
                maxLength={30}
                value={form.barcode}
                onChange={(e) => updateField('barcode', e.target.value)}
              />
              {errors.barcode ? (
                <span className="text-xs text-destructive">{errors.barcode}</span>
              ) : null}
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">价格与说明</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>默认零售价</span>
              <input
                className={inputClass(Boolean(errors.defaultRetailPrice))}
                inputMode="decimal"
                placeholder="选填"
                value={form.defaultRetailPrice}
                onChange={(e) => updateField('defaultRetailPrice', e.target.value)}
              />
              {errors.defaultRetailPrice ? (
                <span className="text-xs text-destructive">{errors.defaultRetailPrice}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>
                默认批发价 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.defaultWholesalePrice))}
                inputMode="decimal"
                value={form.defaultWholesalePrice}
                onChange={(e) => updateField('defaultWholesalePrice', e.target.value)}
              />
              {errors.defaultWholesalePrice ? (
                <span className="text-xs text-destructive">{errors.defaultWholesalePrice}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>参考采购价</span>
              <input
                className={inputClass(Boolean(errors.referencePurchasePrice))}
                inputMode="decimal"
                placeholder="选填"
                value={form.referencePurchasePrice}
                onChange={(e) => updateField('referencePurchasePrice', e.target.value)}
              />
              {errors.referencePurchasePrice ? (
                <span className="text-xs text-destructive">{errors.referencePurchasePrice}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>商品备注</span>
              <textarea
                className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                maxLength={200}
                value={form.remark}
                onChange={(e) => updateField('remark', e.target.value)}
              />
              {errors.remark ? (
                <span className="text-xs text-destructive">{errors.remark}</span>
              ) : null}
            </label>
          </div>
        </section>

        {isEdit && existing ? (
          <section className="rounded-xl border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold">系统信息</h3>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">创建人：</span>
                {existing.createdBy}
              </div>
              <div>
                <span className="text-muted-foreground">创建时间：</span>
                {formatDateTime(existing.createdAt)}
              </div>
              <div>
                <span className="text-muted-foreground">最后修改人：</span>
                {existing.updatedBy}
              </div>
              <div>
                <span className="text-muted-foreground">最后修改时间：</span>
                {formatDateTime(existing.updatedAt)}
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
            取消
          </Button>
          <Button type="submit">保存</Button>
        </div>
      </form>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

// 编辑路由复用同一组件
export function ProductEdit() {
  return <ProductNew />
}
