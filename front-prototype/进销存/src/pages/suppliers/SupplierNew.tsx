import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import { formatDateTime } from '@/features/products/format'
import {
  isValidContactPhone,
  SETTLEMENT_OPTIONS,
  SUPPLIER_CODE_MAX_LENGTH,
  SUPPLIER_CODE_MIN_LENGTH,
  SUPPLIER_CODE_PATTERN,
} from '@/features/suppliers/constants'
import {
  getSupplierByCode,
  getSupplierById,
  nextSupplierId,
  upsertSupplier,
} from '@/features/suppliers/storage'
import type { SettlementMethod, Supplier } from '@/features/suppliers/types'

type FormState = {
  supplierCode: string
  supplierName: string
  contactName: string
  contactPhone: string
  contactAddress: string
  settlementMethod: SettlementMethod | ''
  paymentTermDays: string
  taxRate: string
  remark: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  supplierCode: '',
  supplierName: '',
  contactName: '',
  contactPhone: '',
  contactAddress: '',
  settlementMethod: '',
  paymentTermDays: '0',
  taxRate: '',
  remark: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function supplierToForm(supplier: Supplier): FormState {
  return {
    supplierCode: supplier.supplierCode,
    supplierName: supplier.supplierName,
    contactName: supplier.contactName,
    contactPhone: supplier.contactPhone,
    contactAddress: supplier.contactAddress ?? '',
    settlementMethod: supplier.settlementMethod,
    paymentTermDays: String(supplier.paymentTermDays),
    taxRate: supplier.taxRate ?? '',
    remark: supplier.remark ?? '',
  }
}

function inputClass(invalid?: boolean) {
  return [
    'h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    invalid ? 'border-destructive' : '',
  ].join(' ')
}

export function SupplierNew() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const existing = useMemo(() => (id ? getSupplierById(id) : undefined), [id])

  const [form, setForm] = useState<FormState>(() =>
    existing ? supplierToForm(existing) : emptyForm,
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [codeFormatError, setCodeFormatError] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  if (isEdit && !existing) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到供应商档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
          返回列表
        </Button>
      </div>
    )
  }

  const codeReadOnly = isEdit && existing?.isReferenced
  const isAccountSettlement = form.settlementMethod === 'ACCOUNT'
  const paymentTermReadOnly = form.settlementMethod === 'CASH'

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'settlementMethod') {
        if (value === 'CASH') next.paymentTermDays = '0'
      }
      return next
    })
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleSupplierCodeChange(raw: string) {
    const upper = raw.toUpperCase()
    if (!SUPPLIER_CODE_PATTERN.test(upper)) {
      setCodeFormatError('供应商编码只允许大写字母、数字和连字符（-）')
      return
    }
    setCodeFormatError('')
    if (upper.length > SUPPLIER_CODE_MAX_LENGTH) return
    updateField('supplierCode', upper)
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const code = form.supplierCode.trim()
    const name = form.supplierName.trim()
    const contact = form.contactName.trim()
    const phone = form.contactPhone.trim()

    if (!code) next.supplierCode = '供应商编码不能为空'
    else if (code.length < SUPPLIER_CODE_MIN_LENGTH) next.supplierCode = '供应商编码至少 2 个字符'
    else if (!SUPPLIER_CODE_PATTERN.test(code)) {
      next.supplierCode = '供应商编码只允许大写字母、数字和连字符（-）'
    } else if (!codeReadOnly) {
      const dup = getSupplierByCode(code, existing?.id)
      if (dup) next.supplierCode = '供应商编码已存在'
    }

    if (!name) next.supplierName = '供应商名称不能为空'
    else if (name.length > 50) next.supplierName = '供应商名称最多 50 个字符'

    if (!contact) next.contactName = '联系人不能为空'
    else if (contact.length > 20) next.contactName = '联系人最多 20 个字符'

    if (!phone) next.contactPhone = '联系电话不能为空'
    else if (phone.length > 20) next.contactPhone = '联系电话最多 20 个字符'
    else if (!isValidContactPhone(phone)) next.contactPhone = '请输入有效的手机号或座机号'

    if (form.contactAddress.length > 100) next.contactAddress = '联系地址最多 100 个字符'

    if (!form.settlementMethod) next.settlementMethod = '请选择结算方式'

    if (form.settlementMethod === 'ACCOUNT') {
      const termRaw = form.paymentTermDays.trim()
      if (!termRaw) next.paymentTermDays = '账期天数不能为空'
      else if (!/^\d+$/.test(termRaw)) next.paymentTermDays = '账期天数须为 0-365 的整数'
      else {
        const days = Number(termRaw)
        if (days < 0 || days > 365) next.paymentTermDays = '账期天数须为 0-365 的整数'
      }
    }

    if (form.taxRate.length > 10) next.taxRate = '税率最多 10 个字符'
    if (form.remark.length > 200) next.remark = '供应商备注最多 200 个字符'

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
    const paymentTermDays =
      form.settlementMethod === 'CASH' ? 0 : Number(form.paymentTermDays.trim())

    if (isEdit && existing) {
      upsertSupplier({
        ...existing,
        supplierCode: existing.isReferenced ? existing.supplierCode : form.supplierCode.trim(),
        supplierName: form.supplierName.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactAddress: form.contactAddress.trim() || null,
        settlementMethod: form.settlementMethod as SettlementMethod,
        paymentTermDays,
        taxRate: form.taxRate.trim() || null,
        remark: form.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertSupplier({
        id: nextSupplierId(),
        supplierCode: form.supplierCode.trim(),
        supplierName: form.supplierName.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactAddress: form.contactAddress.trim() || null,
        settlementMethod: form.settlementMethod as SettlementMethod,
        paymentTermDays,
        taxRate: form.taxRate.trim() || null,
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
    window.setTimeout(() => navigate('/master/suppliers'), 400)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {isEdit ? '编辑供应商' : '新增供应商'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? '修改供应商资料与结算规则' : '创建新的供应商档案，保存后默认启用'}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
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
          <h3 className="mb-4 text-sm font-semibold">供应商资料</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>
                供应商编码 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.supplierCode || codeFormatError))}
                value={form.supplierCode}
                readOnly={codeReadOnly}
                disabled={codeReadOnly}
                maxLength={SUPPLIER_CODE_MAX_LENGTH}
                placeholder="VEND-0001"
                onChange={(e) => handleSupplierCodeChange(e.target.value)}
              />
              {codeReadOnly ? (
                <span className="text-xs text-muted-foreground">
                  该供应商已被业务单据引用，编码不可修改
                </span>
              ) : null}
              {codeFormatError ? (
                <span className="text-xs text-destructive">{codeFormatError}</span>
              ) : null}
              {errors.supplierCode ? (
                <span className="text-xs text-destructive">{errors.supplierCode}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>
                供应商名称 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.supplierName))}
                maxLength={50}
                value={form.supplierName}
                onChange={(e) => updateField('supplierName', e.target.value)}
              />
              {errors.supplierName ? (
                <span className="text-xs text-destructive">{errors.supplierName}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>
                联系人 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.contactName))}
                maxLength={20}
                value={form.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
              />
              {errors.contactName ? (
                <span className="text-xs text-destructive">{errors.contactName}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>
                联系电话 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.contactPhone))}
                maxLength={20}
                value={form.contactPhone}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                onBlur={() => {
                  const phone = form.contactPhone.trim()
                  if (phone && !isValidContactPhone(phone)) {
                    setErrors((prev) => ({
                      ...prev,
                      contactPhone: '请输入有效的手机号或座机号',
                    }))
                  }
                }}
              />
              {errors.contactPhone ? (
                <span className="text-xs text-destructive">{errors.contactPhone}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>联系地址</span>
              <textarea
                className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                maxLength={100}
                value={form.contactAddress}
                onChange={(e) => updateField('contactAddress', e.target.value)}
              />
              {errors.contactAddress ? (
                <span className="text-xs text-destructive">{errors.contactAddress}</span>
              ) : null}
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">结算规则</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>
                结算方式 <span className="text-destructive">*</span>
              </span>
              <select
                className={inputClass(Boolean(errors.settlementMethod))}
                value={form.settlementMethod}
                onChange={(e) =>
                  updateField('settlementMethod', e.target.value as SettlementMethod | '')
                }
              >
                <option value="">请选择</option>
                {SETTLEMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.settlementMethod ? (
                <span className="text-xs text-destructive">{errors.settlementMethod}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>
                账期天数
                {isAccountSettlement ? <span className="text-destructive"> *</span> : null}
              </span>
              <input
                className={inputClass(Boolean(errors.paymentTermDays))}
                readOnly={paymentTermReadOnly}
                disabled={paymentTermReadOnly}
                inputMode="numeric"
                value={paymentTermReadOnly ? '0' : form.paymentTermDays}
                onChange={(e) => updateField('paymentTermDays', e.target.value)}
              />
              {paymentTermReadOnly ? (
                <span className="text-xs text-muted-foreground">现付时账期天数固定为 0</span>
              ) : null}
              {errors.paymentTermDays ? (
                <span className="text-xs text-destructive">{errors.paymentTermDays}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>税率</span>
              <input
                className={inputClass(Boolean(errors.taxRate))}
                maxLength={10}
                placeholder="如 13%、未税"
                value={form.taxRate}
                onChange={(e) => updateField('taxRate', e.target.value)}
              />
              {errors.taxRate ? (
                <span className="text-xs text-destructive">{errors.taxRate}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>供应商备注</span>
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
          <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
            取消
          </Button>
          <Button type="submit">保存</Button>
        </div>
      </form>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export function SupplierEdit() {
  return <SupplierNew />
}
