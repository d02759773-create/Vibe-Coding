import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import { formatDateTime } from '@/features/products/format'
import { LOGISTICS_TYPE_OPTIONS } from '@/features/logistics/constants'
import {
  getLogisticsById,
  nextLogisticsCode,
  nextLogisticsId,
  upsertLogistics,
} from '@/features/logistics/storage'
import type { Logistics, LogisticsType } from '@/features/logistics/types'

type FormState = {
  logisticsName: string
  logisticsType: LogisticsType | ''
  serviceProvider: string
  remark: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  logisticsName: '',
  logisticsType: '',
  serviceProvider: '',
  remark: '',
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function toForm(row: Logistics): FormState {
  return {
    logisticsName: row.logisticsName,
    logisticsType: row.logisticsType,
    serviceProvider: row.serviceProvider ?? '',
    remark: row.remark ?? '',
  }
}

function inputClass(invalid?: boolean) {
  return [
    'h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    invalid ? 'border-destructive' : '',
  ].join(' ')
}

export function LogisticsNew() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const existing = useMemo(() => (id ? getLogisticsById(id) : undefined), [id])

  const [form, setForm] = useState<FormState>(() => (existing ? toForm(existing) : emptyForm))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [toast, setToast] = useState<string | null>(null)

  if (isEdit && !existing) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到物流档案。</p>
        <Button type="button" variant="outline" onClick={() => navigate('/master/logistics')}>
          返回列表
        </Button>
      </div>
    )
  }

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
    const name = form.logisticsName.trim()

    if (!name) next.logisticsName = '物流名称不能为空'
    else if (name.length > 50) next.logisticsName = '物流名称最多 50 个字符'

    if (!form.logisticsType) next.logisticsType = '请选择物流类型'

    if (form.serviceProvider.trim().length > 50) {
      next.serviceProvider = '物流服务商最多 50 个字符'
    }

    if (form.remark.length > 200) next.remark = '物流备注最多 200 个字符'

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
      upsertLogistics({
        ...existing,
        logisticsName: form.logisticsName.trim(),
        logisticsType: existing.logisticsType,
        serviceProvider: form.serviceProvider.trim() || null,
        remark: form.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertLogistics({
        id: nextLogisticsId(),
        logisticsCode: nextLogisticsCode(),
        logisticsName: form.logisticsName.trim(),
        logisticsType: form.logisticsType as LogisticsType,
        serviceProvider: form.serviceProvider.trim() || null,
        remark: form.remark.trim() || null,
        status: 'ENABLED',
        disableReason: null,
        isReferenced: false,
        mockOpenOutboundCount: 0,
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
    window.setTimeout(() => navigate('/master/logistics'), 400)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4" data-anno="logistics-form-page">
      <div
        className="flex flex-wrap items-center justify-between gap-3"
        data-anno="logistics-form-header"
      >
        <div>
          <p className="text-sm text-muted-foreground">
            {isEdit ? '基础资料 / 物流管理 / 编辑' : '基础资料 / 新增物流管理'}
          </p>
          <h2 className="text-xl font-semibold tracking-tight">
            {isEdit ? '编辑物流' : '新增物流'}
          </h2>
          <p className="text-sm text-muted-foreground">基础识别信息</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/master/logistics')}>
            返回列表
          </Button>
          <Button type="button" onClick={handleSubmit}>
            保存
          </Button>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <section className="rounded-xl border bg-card p-4" data-anno="logistics-form-basic">
          <h3 className="mb-4 text-sm font-semibold">基础识别信息</h3>
          {!isEdit ? (
            <p className="mb-4 text-sm text-muted-foreground">物流编码将在保存后由系统自动生成（LOG-xxxx）。</p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isEdit && existing ? (
              <label className="grid gap-1 text-sm lg:col-span-2">
                <span>物流编码</span>
                <input className={inputClass()} readOnly disabled value={existing.logisticsCode} />
              </label>
            ) : null}

            <label className="grid gap-1 text-sm">
              <span>
                物流名称 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass(Boolean(errors.logisticsName))}
                maxLength={50}
                placeholder="请输入物流名称"
                value={form.logisticsName}
                onChange={(e) => updateField('logisticsName', e.target.value)}
              />
              {errors.logisticsName ? (
                <span className="text-xs text-destructive">{errors.logisticsName}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>
                物流类型 <span className="text-destructive">*</span>
              </span>
              {isEdit ? (
                <input
                  className={inputClass()}
                  readOnly
                  disabled
                  value={
                    LOGISTICS_TYPE_OPTIONS.find((o) => o.value === form.logisticsType)?.label ?? ''
                  }
                />
              ) : (
                <select
                  className={inputClass(Boolean(errors.logisticsType))}
                  value={form.logisticsType}
                  onChange={(e) =>
                    updateField('logisticsType', e.target.value as LogisticsType | '')
                  }
                >
                  <option value="">请选择</option>
                  {LOGISTICS_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              {errors.logisticsType ? (
                <span className="text-xs text-destructive">{errors.logisticsType}</span>
              ) : null}
            </label>

            <label className="grid gap-1 text-sm">
              <span>物流服务商</span>
              <input
                className={inputClass(Boolean(errors.serviceProvider))}
                maxLength={50}
                placeholder="可填写顺丰/圆通/中通/韵达/申通/邮政/其他，或自定义"
                value={form.serviceProvider}
                onChange={(e) => updateField('serviceProvider', e.target.value)}
              />
              {errors.serviceProvider ? (
                <span className="text-xs text-destructive">{errors.serviceProvider}</span>
              ) : null}
            </label>
          </div>

          <label className="mt-4 grid gap-1 text-sm">
            <span>物流备注</span>
            <textarea
              className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              maxLength={200}
              placeholder="补充物流说明或特殊限制"
              value={form.remark}
              onChange={(e) => updateField('remark', e.target.value)}
            />
            {errors.remark ? <span className="text-xs text-destructive">{errors.remark}</span> : null}
          </label>
        </section>

        {isEdit && existing ? (
          <section className="rounded-xl border bg-card p-4" data-anno="logistics-form-system">
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
      </form>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export function LogisticsEdit() {
  return <LogisticsNew />
}
