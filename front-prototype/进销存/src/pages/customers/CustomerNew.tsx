import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import {
  CUSTOMER_CODE_MAX_LENGTH,
  CUSTOMER_CODE_MIN_LENGTH,
  CUSTOMER_GRADE_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  isValidContactPhone,
  SETTLEMENT_OPTIONS,
} from '@/features/customers/constants'
import {
  citiesOfProvince,
  districtsOf,
  PROVINCES,
} from '@/features/customers/regions'
import {
  getCustomerByCode,
  getCustomerById,
  nextCustomerId,
  upsertCustomer,
} from '@/features/customers/storage'
import type {
  Customer,
  CustomerGrade,
  CustomerType,
  SettlementMethod,
} from '@/features/customers/types'
import { formatDateTime } from '@/features/products/format'

type FormState = {
  customerCode: string
  customerName: string
  customerType: CustomerType | ''
  customerGrade: CustomerGrade | ''
  contactName: string
  contactPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  salesperson: string
  openingArrears: string
  openingBalance: string
  settlementMethod: SettlementMethod | ''
  paymentTermDays: string
  creditLimit: string
  remark: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  customerCode: '',
  customerName: '',
  customerType: '',
  customerGrade: '',
  contactName: '',
  contactPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  salesperson: '',
  openingArrears: '0',
  openingBalance: '0',
  settlementMethod: '',
  paymentTermDays: '0',
  creditLimit: '0',
  remark: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function customerToForm(c: Customer): FormState {
  return {
    customerCode: c.customerCode,
    customerName: c.customerName,
    customerType: c.customerType,
    customerGrade: c.customerGrade,
    contactName: c.contactName,
    contactPhone: c.contactPhone,
    province: c.province,
    city: c.city,
    district: c.district,
    detailAddress: c.detailAddress ?? '',
    salesperson: c.salesperson ?? '',
    openingArrears: String(c.openingArrears),
    openingBalance: String(c.openingBalance),
    settlementMethod: c.settlementMethod,
    paymentTermDays: String(c.paymentTermDays),
    creditLimit: String(c.creditLimit),
    remark: c.remark ?? '',
  }
}

function parseMoneyField(raw: string, fieldLabel: string, errors: FieldErrors, key: keyof FormState) {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    errors[key] = `${fieldLabel}格式不正确`
    return null
  }
  const n = Number(trimmed)
  if (n < 0) {
    errors[key] = `${fieldLabel}不能为负数`
    return null
  }
  return Math.round(n * 100) / 100
}

function inputClass(invalid?: boolean) {
  return [
    'h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    invalid ? 'border-destructive' : '',
  ].join(' ')
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  )
}

function CustomerFormPage({ isEdit }: { isEdit: boolean }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const existing = useMemo(() => (isEdit && id ? getCustomerById(id) : undefined), [isEdit, id])

  const [form, setForm] = useState<FormState>(() =>
    existing ? customerToForm(existing) : emptyForm,
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [toast, setToast] = useState<string | null>(null)

  const cityOptions = useMemo(() => citiesOfProvince(form.province), [form.province])
  const districtOptions = useMemo(
    () => districtsOf(form.province, form.city),
    [form.province, form.city],
  )

  if (isEdit && !existing) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到客户档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
          返回列表
        </Button>
      </div>
    )
  }

  const codeReadOnly = isEdit && existing?.isReferenced
  const paymentTermReadOnly = form.settlementMethod === 'CASH'

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'province') {
        next.city = ''
        next.district = ''
      }
      if (key === 'city') {
        next.district = ''
      }
      if (key === 'settlementMethod' && value === 'CASH') {
        next.paymentTermDays = '0'
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

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const code = form.customerCode.trim()
    const name = form.customerName.trim()

    if (!code) next.customerCode = '客户编码不能为空'
    else if (code.length < CUSTOMER_CODE_MIN_LENGTH || code.length > CUSTOMER_CODE_MAX_LENGTH) {
      next.customerCode = `客户编码须为 ${CUSTOMER_CODE_MIN_LENGTH}–${CUSTOMER_CODE_MAX_LENGTH} 个字符`
    } else if (!codeReadOnly) {
      const dup = getCustomerByCode(code, existing?.id)
      if (dup) next.customerCode = '客户编码已存在'
    }

    if (!name) next.customerName = '客户名称不能为空'
    else if (name.length > 100) next.customerName = '客户名称最多 100 个字符'

    if (!form.customerType) next.customerType = '请选择客户类型'
    if (!form.customerGrade) next.customerGrade = '请选择客户等级'

    if (!form.contactName.trim()) next.contactName = '联系人不能为空'
    else if (form.contactName.trim().length > 20) next.contactName = '联系人最多 20 个字符'

    const phone = form.contactPhone.trim()
    if (!phone) next.contactPhone = '联系电话不能为空'
    else if (phone.length > 20) next.contactPhone = '联系电话最多 20 个字符'
    else if (!isValidContactPhone(phone)) next.contactPhone = '请输入有效的手机号或座机号'

    if (!form.province) next.province = '请选择省份'
    if (!form.city) next.city = '请选择城市'
    if (!form.district) next.district = '请选择区/县'

    if (form.detailAddress.length > 200) next.detailAddress = '详细地址最多 200 个字符'

    if (!form.settlementMethod) next.settlementMethod = '请选择结算方式'

    if (form.settlementMethod === 'ACCOUNT') {
      const termRaw = form.paymentTermDays.trim()
      if (!termRaw) next.paymentTermDays = '请填写账期天数'
      else if (!/^\d+$/.test(termRaw)) next.paymentTermDays = '账期天数须为 0-365 的整数'
      else {
        const days = Number(termRaw)
        if (days < 0 || days > 365) next.paymentTermDays = '账期天数须为 0-365 的整数'
      }
    }

    parseMoneyField(form.openingArrears, '期初欠款', next, 'openingArrears')
    parseMoneyField(form.openingBalance, '期初余额', next, 'openingBalance')
    parseMoneyField(form.creditLimit, '信用额度', next, 'creditLimit')

    if (form.remark.length > 200) next.remark = '客户备注最多 200 个字符'

    return next
  }

  function handleSubmit() {
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const openingArrears = parseMoneyField(form.openingArrears, '期初欠款', {}, 'openingArrears') ?? 0
    const openingBalance = parseMoneyField(form.openingBalance, '期初余额', {}, 'openingBalance') ?? 0
    const creditLimit = parseMoneyField(form.creditLimit, '信用额度', {}, 'creditLimit') ?? 0
    const paymentTermDays =
      form.settlementMethod === 'CASH' ? 0 : Number(form.paymentTermDays.trim())
    const timestamp = nowString()

    if (isEdit && existing) {
      upsertCustomer({
        ...existing,
        customerCode: existing.isReferenced ? existing.customerCode : form.customerCode.trim(),
        customerName: form.customerName.trim(),
        customerType: form.customerType as CustomerType,
        customerGrade: form.customerGrade as CustomerGrade,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        province: form.province,
        city: form.city,
        district: form.district,
        detailAddress: form.detailAddress.trim() || null,
        salesperson: form.salesperson.trim() || null,
        openingArrears,
        openingBalance,
        settlementMethod: form.settlementMethod as SettlementMethod,
        paymentTermDays,
        creditLimit,
        remark: form.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertCustomer({
        id: nextCustomerId(),
        customerCode: form.customerCode.trim(),
        customerName: form.customerName.trim(),
        customerType: form.customerType as CustomerType,
        customerGrade: form.customerGrade as CustomerGrade,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        province: form.province,
        city: form.city,
        district: form.district,
        detailAddress: form.detailAddress.trim() || null,
        salesperson: form.salesperson.trim() || null,
        openingArrears,
        openingBalance,
        settlementMethod: form.settlementMethod as SettlementMethod,
        paymentTermDays,
        creditLimit,
        remark: form.remark.trim() || null,
        status: 'ENABLED',
        disableReason: null,
        isReferenced: false,
        mockReceivableAdjust: 0,
        createdBy: '管理员',
        createdAt: timestamp,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    }

    setToast('保存成功')
    setTimeout(() => navigate('/master/customers'), 400)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{isEdit ? '编辑客户' : '新增客户'}</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
            返回列表
          </Button>
          <Button type="button" onClick={handleSubmit}>
            保存
          </Button>
        </div>
      </div>

      <FormSection title="基础识别信息">
        <label className="grid gap-1 text-sm">
          <span>
            客户编码 <span className="text-destructive">*</span>
          </span>
          <input
            className={inputClass(Boolean(errors.customerCode))}
            placeholder="建议格式: CUST-0001"
            readOnly={codeReadOnly}
            value={form.customerCode}
            onChange={(e) => updateField('customerCode', e.target.value)}
          />
          {errors.customerCode ? (
            <span className="text-xs text-destructive">{errors.customerCode}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            客户名称 <span className="text-destructive">*</span>
          </span>
          <input
            className={inputClass(Boolean(errors.customerName))}
            placeholder="请输入客户名称"
            value={form.customerName}
            onChange={(e) => updateField('customerName', e.target.value)}
          />
          {errors.customerName ? (
            <span className="text-xs text-destructive">{errors.customerName}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            客户类型 <span className="text-destructive">*</span>
          </span>
          <select
            className={inputClass(Boolean(errors.customerType))}
            value={form.customerType}
            onChange={(e) =>
              updateField('customerType', e.target.value as FormState['customerType'])
            }
          >
            <option value="">请选择</option>
            {CUSTOMER_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.customerType ? (
            <span className="text-xs text-destructive">{errors.customerType}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            客户等级 <span className="text-destructive">*</span>
          </span>
          <select
            className={inputClass(Boolean(errors.customerGrade))}
            value={form.customerGrade}
            onChange={(e) =>
              updateField('customerGrade', e.target.value as FormState['customerGrade'])
            }
          >
            <option value="">请选择</option>
            {CUSTOMER_GRADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.customerGrade ? (
            <span className="text-xs text-destructive">{errors.customerGrade}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            联系人 <span className="text-destructive">*</span>
          </span>
          <input
            className={inputClass(Boolean(errors.contactName))}
            placeholder="请输入联系人"
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
            placeholder="请输入联系电话"
            value={form.contactPhone}
            onChange={(e) => updateField('contactPhone', e.target.value)}
          />
          {errors.contactPhone ? (
            <span className="text-xs text-destructive">{errors.contactPhone}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            省份 <span className="text-destructive">*</span>
          </span>
          <select
            className={inputClass(Boolean(errors.province))}
            value={form.province}
            onChange={(e) => updateField('province', e.target.value)}
          >
            <option value="">请选择省份</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.province ? (
            <span className="text-xs text-destructive">{errors.province}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            城市 <span className="text-destructive">*</span>
          </span>
          <select
            className={inputClass(Boolean(errors.city))}
            value={form.city}
            disabled={!form.province}
            onChange={(e) => updateField('city', e.target.value)}
          >
            <option value="">{form.province ? '请选择城市' : '请先选择省份'}</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.city ? <span className="text-xs text-destructive">{errors.city}</span> : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            区/县 <span className="text-destructive">*</span>
          </span>
          <select
            className={inputClass(Boolean(errors.district))}
            value={form.district}
            disabled={!form.city}
            onChange={(e) => updateField('district', e.target.value)}
          >
            <option value="">{form.city ? '请选择区/县' : '请先选择城市'}</option>
            {districtOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.district ? (
            <span className="text-xs text-destructive">{errors.district}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span>详细地址</span>
          <input
            className={inputClass(Boolean(errors.detailAddress))}
            placeholder="请输入街道、门牌号等详细地址"
            value={form.detailAddress}
            onChange={(e) => updateField('detailAddress', e.target.value)}
          />
          {errors.detailAddress ? (
            <span className="text-xs text-destructive">{errors.detailAddress}</span>
          ) : null}
        </label>
      </FormSection>

      <FormSection title="经营与结算信息">
        <label className="grid gap-1 text-sm">
          <span>归属业务员</span>
          <input
            className={inputClass()}
            placeholder="请输入归属业务员"
            value={form.salesperson}
            onChange={(e) => updateField('salesperson', e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>期初欠款</span>
          <input
            className={inputClass(Boolean(errors.openingArrears))}
            inputMode="decimal"
            value={form.openingArrears}
            onChange={(e) => updateField('openingArrears', e.target.value)}
          />
          {errors.openingArrears ? (
            <span className="text-xs text-destructive">{errors.openingArrears}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>期初余额</span>
          <input
            className={inputClass(Boolean(errors.openingBalance))}
            inputMode="decimal"
            value={form.openingBalance}
            onChange={(e) => updateField('openingBalance', e.target.value)}
          />
          {errors.openingBalance ? (
            <span className="text-xs text-destructive">{errors.openingBalance}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            结算方式 <span className="text-destructive">*</span>
          </span>
          <select
            className={inputClass(Boolean(errors.settlementMethod))}
            value={form.settlementMethod}
            onChange={(e) =>
              updateField('settlementMethod', e.target.value as FormState['settlementMethod'])
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
          <span>账期天数</span>
          <input
            className={inputClass(Boolean(errors.paymentTermDays))}
            readOnly={paymentTermReadOnly}
            value={paymentTermReadOnly ? '0' : form.paymentTermDays}
            onChange={(e) => updateField('paymentTermDays', e.target.value)}
          />
          {errors.paymentTermDays ? (
            <span className="text-xs text-destructive">{errors.paymentTermDays}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span>信用额度</span>
          <input
            className={inputClass(Boolean(errors.creditLimit))}
            inputMode="decimal"
            value={form.creditLimit}
            onChange={(e) => updateField('creditLimit', e.target.value)}
          />
          <span className="text-xs text-muted-foreground">0 表示不启用销售硬控</span>
          {errors.creditLimit ? (
            <span className="text-xs text-destructive">{errors.creditLimit}</span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-3">
          <span>客户备注</span>
          <textarea
            className="min-h-20 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            placeholder="记录补充信息或特殊合作说明"
            maxLength={200}
            value={form.remark}
            onChange={(e) => updateField('remark', e.target.value)}
          />
          {errors.remark ? <span className="text-xs text-destructive">{errors.remark}</span> : null}
        </label>
      </FormSection>

      {isEdit && existing ? (
        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">系统信息</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">创建人 </span>
              {existing.createdBy}
            </div>
            <div>
              <span className="text-muted-foreground">创建时间 </span>
              {formatDateTime(existing.createdAt)}
            </div>
            <div>
              <span className="text-muted-foreground">最后修改人 </span>
              {existing.updatedBy}
            </div>
            <div>
              <span className="text-muted-foreground">最后修改时间 </span>
              {formatDateTime(existing.updatedAt)}
            </div>
          </dl>
        </section>
      ) : null}

      <div className="flex justify-end gap-2 pb-4">
        <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
          取消
        </Button>
        <Button type="button" onClick={handleSubmit}>
          保存
        </Button>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export function CustomerNew() {
  return <CustomerFormPage isEdit={false} />
}

export function CustomerEdit() {
  return <CustomerFormPage isEdit={true} />
}
