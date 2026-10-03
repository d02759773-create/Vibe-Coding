import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import { formatDateTime } from '@/features/products/format'
import { isValidContactPhone } from '@/features/suppliers/constants'
import {
  WAREHOUSE_CODE_MAX_LENGTH,
  WAREHOUSE_CODE_MIN_LENGTH,
  WAREHOUSE_TYPE_OPTIONS,
} from '@/features/warehouses/constants'
import {
  getWarehouseByCode,
  getWarehouseById,
  nextWarehouseId,
  upsertWarehouse,
} from '@/features/warehouses/storage'
import type { Warehouse, WarehouseType } from '@/features/warehouses/types'

type FormState = {
  warehouseCode: string
  warehouseName: string
  warehouseType: WarehouseType | ''
  address: string
  managerName: string
  contactPhone: string
  remark: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  warehouseCode: '',
  warehouseName: '',
  warehouseType: '',
  address: '',
  managerName: '',
  contactPhone: '',
  remark: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function warehouseToForm(w: Warehouse): FormState {
  return {
    warehouseCode: w.warehouseCode,
    warehouseName: w.warehouseName,
    warehouseType: w.warehouseType,
    address: w.address,
    managerName: w.managerName,
    contactPhone: w.contactPhone ?? '',
    remark: w.remark ?? '',
  }
}

function inputClass(invalid?: boolean) {
  return [
    'h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    invalid ? 'border-destructive' : '',
  ].join(' ')
}

export function WarehouseNew() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const existing = useMemo(() => (id ? getWarehouseById(id) : undefined), [id])

  const [form, setForm] = useState<FormState>(() =>
    existing ? warehouseToForm(existing) : emptyForm,
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [toast, setToast] = useState<string | null>(null)

  if (isEdit && !existing) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到仓库档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
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

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const code = form.warehouseCode.trim()
    const name = form.warehouseName.trim()
    const manager = form.managerName.trim()
    const phone = form.contactPhone.trim()

    if (!code) next.warehouseCode = '仓库编码不能为空'
    else if (code.length < WAREHOUSE_CODE_MIN_LENGTH || code.length > WAREHOUSE_CODE_MAX_LENGTH) {
      next.warehouseCode = `仓库编码须为 ${WAREHOUSE_CODE_MIN_LENGTH}–${WAREHOUSE_CODE_MAX_LENGTH} 个字符`
    } else if (!codeReadOnly) {
      const dup = getWarehouseByCode(code, existing?.id)
      if (dup) next.warehouseCode = '仓库编码已存在'
    }

    if (!name) next.warehouseName = '仓库名称不能为空'
    else if (name.length > 50) next.warehouseName = '仓库名称最多 50 个字符'

    if (!form.warehouseType) next.warehouseType = '请选择仓库类型'

    if (!form.address.trim()) next.address = '仓库地址不能为空'
    else if (form.address.trim().length > 200) next.address = '仓库地址最多 200 个字符'

    if (!manager) next.managerName = '负责人不能为空'
    else if (manager.length > 20) next.managerName = '负责人最多 20 个字符'

    if (phone.length > 20) next.contactPhone = '联系电话最多 20 个字符'
    else if (phone && !isValidContactPhone(phone)) {
      next.contactPhone = '请输入有效的手机号或座机号'
    }

    if (form.remark.length > 200) next.remark = '仓库备注最多 200 个字符'

    return next
  }

  function handleSubmit() {
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const timestamp = nowString()

    if (isEdit && existing) {
      upsertWarehouse({
        ...existing,
        warehouseCode: existing.isReferenced ? existing.warehouseCode : form.warehouseCode.trim(),
        warehouseName: form.warehouseName.trim(),
        warehouseType: existing.warehouseType,
        address: form.address.trim(),
        managerName: form.managerName.trim(),
        contactPhone: form.contactPhone.trim() || null,
        remark: form.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertWarehouse({
        id: nextWarehouseId(),
        warehouseCode: form.warehouseCode.trim(),
        warehouseName: form.warehouseName.trim(),
        warehouseType: form.warehouseType as WarehouseType,
        address: form.address.trim(),
        managerName: form.managerName.trim(),
        contactPhone: form.contactPhone.trim() || null,
        remark: form.remark.trim() || null,
        status: 'ENABLED',
        disableReason: null,
        isReferenced: false,
        mockInventoryQty: 0,
        createdBy: '管理员',
        createdAt: timestamp,
        updatedBy: '管理员',
        updatedAt: timestamp,
        disabledBy: null,
        disabledAt: null,
        enabledBy: '管理员',
        enabledAt: timestamp,
      })
    }

    setToast('保存成功')
    window.setTimeout(() => navigate('/master/warehouses'), 400)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4" data-anno="warehouse-form-page">
      <div className="flex flex-wrap items-center justify-between gap-3" data-anno="warehouse-form-header">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {isEdit ? '编辑仓库' : '新增仓库'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? '修改仓库资料' : '创建仓库档案，保存后默认启用'}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
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
        <section className="rounded-xl border bg-card p-4" data-anno="warehouse-form-basic">
          <h3 className="mb-4 text-sm font-semibold">基础资料</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>
                仓库编码 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.warehouseCode))}
                value={form.warehouseCode}
                readOnly={codeReadOnly}
                disabled={codeReadOnly}
                maxLength={WAREHOUSE_CODE_MAX_LENGTH}
                placeholder="WH-CN-DG"
                onChange={(e) => updateField('warehouseCode', e.target.value)}
              />
              {codeReadOnly ? (
                <span className="text-xs text-muted-foreground">
                  该仓库已被业务单据引用，编码不可修改
                </span>
              ) : null}
              {errors.warehouseCode ? (
                <span className="text-xs text-destructive">{errors.warehouseCode}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>
                仓库名称 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.warehouseName))}
                maxLength={50}
                value={form.warehouseName}
                onChange={(e) => updateField('warehouseName', e.target.value)}
              />
              {errors.warehouseName ? (
                <span className="text-xs text-destructive">{errors.warehouseName}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span>
                仓库类型 <span className="text-destructive">*</span>
              </span>
              {isEdit ? (
                <input
                  className={inputClass()}
                  readOnly
                  disabled
                  value={
                    WAREHOUSE_TYPE_OPTIONS.find((o) => o.value === form.warehouseType)?.label ??
                    ''
                  }
                />
              ) : (
                <select
                  className={inputClass(Boolean(errors.warehouseType))}
                  value={form.warehouseType}
                  onChange={(e) =>
                    updateField('warehouseType', e.target.value as WarehouseType | '')
                  }
                >
                  <option value="">请选择</option>
                  {WAREHOUSE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              {errors.warehouseType ? (
                <span className="text-xs text-destructive">{errors.warehouseType}</span>
              ) : null}
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4" data-anno="warehouse-form-contact">
          <h3 className="mb-4 text-sm font-semibold">联系信息</h3>
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm">
              <span>
                仓库地址 <span className="text-destructive">*</span>
              </span>
              <textarea
                className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                maxLength={200}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
              {errors.address ? (
                <span className="text-xs text-destructive">{errors.address}</span>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span>
                  负责人 <span className="text-destructive">*</span>
                </span>
                <input
                  className={inputClass(Boolean(errors.managerName))}
                  maxLength={20}
                  value={form.managerName}
                  onChange={(e) => updateField('managerName', e.target.value)}
                />
                {errors.managerName ? (
                  <span className="text-xs text-destructive">{errors.managerName}</span>
                ) : null}
              </label>

              <label className="grid gap-1 text-sm">
                <span>联系电话</span>
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
            </div>

            <label className="grid gap-1 text-sm">
              <span>仓库备注</span>
              <textarea
                className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                maxLength={200}
                value={form.remark}
                onChange={(e) => updateField('remark', e.target.value)}
              />
            </label>
          </div>
        </section>

        {isEdit && existing ? (
          <section className="rounded-xl border bg-card p-4" data-anno="warehouse-form-system">
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

        <div className="flex justify-end gap-2 border-t pt-4" data-anno="warehouse-form-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
            取消
          </Button>
          <Button type="submit">保存</Button>
        </div>
      </form>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export function WarehouseEdit() {
  return <WarehouseNew />
}
