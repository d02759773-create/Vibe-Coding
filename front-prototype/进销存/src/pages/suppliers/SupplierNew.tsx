import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageContainer,
  ProForm,
  ProFormDependency,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components'
import { Card, Space, Typography } from 'antd'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import {
  MasterFormCol,
  MasterFormSection,
  masterFormColFull,
  masterFormControlProps,
} from '@/lib/masterFormLayout'
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

type FormValues = {
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

const emptyForm: FormValues = {
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

function supplierToForm(supplier: Supplier): FormValues {
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

function SupplierFormPage({ isEdit }: { isEdit: boolean }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const formRef = useRef<ProFormInstance<FormValues>>(null)
  const existing = useMemo(
    () => (isEdit && id ? getSupplierById(id) : undefined),
    [isEdit, id],
  )
  const [toast, setToast] = useState<string | null>(null)

  const initialValues = useMemo(
    () => (existing ? supplierToForm(existing) : emptyForm),
    [existing],
  )

  if (isEdit && !existing) {
    return (
      <PageContainer title="编辑供应商">
        <Typography.Text type="secondary">未找到供应商档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  const codeReadOnly = Boolean(isEdit && existing?.isReferenced)

  async function handleFinish(values: FormValues) {
    const timestamp = nowString()
    const paymentTermDays =
      values.settlementMethod === 'CASH' ? 0 : Number(String(values.paymentTermDays).trim())

    if (isEdit && existing) {
      upsertSupplier({
        ...existing,
        supplierCode: existing.isReferenced ? existing.supplierCode : values.supplierCode.trim(),
        supplierName: values.supplierName.trim(),
        contactName: values.contactName.trim(),
        contactPhone: values.contactPhone.trim(),
        contactAddress: values.contactAddress.trim() || null,
        settlementMethod: values.settlementMethod as SettlementMethod,
        paymentTermDays,
        taxRate: values.taxRate.trim() || null,
        remark: values.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertSupplier({
        id: nextSupplierId(),
        supplierCode: values.supplierCode.trim(),
        supplierName: values.supplierName.trim(),
        contactName: values.contactName.trim(),
        contactPhone: values.contactPhone.trim(),
        contactAddress: values.contactAddress.trim() || null,
        settlementMethod: values.settlementMethod as SettlementMethod,
        paymentTermDays,
        taxRate: values.taxRate.trim() || null,
        remark: values.remark.trim() || null,
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
    setTimeout(() => navigate('/master/suppliers'), 400)
  }

  return (
    <PageContainer
      title={isEdit ? '编辑供应商' : '新增供应商'}
      data-anno="supplier-form-page"
      extra={
        <Space data-anno="supplier-form-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
            返回列表
          </Button>
          <Button type="button" onClick={() => formRef.current?.submit()}>
            保存
          </Button>
        </Space>
      }
    >
      <ProForm<FormValues>
        formRef={formRef}
        initialValues={initialValues}
        layout="vertical"
        submitter={false}
        onFinish={handleFinish}
        onValuesChange={(changed) => {
          if (changed.settlementMethod === 'CASH') {
            formRef.current?.setFieldsValue({ paymentTermDays: '0' })
          }
        }}
      >
        <MasterFormSection title="供应商资料" data-anno="supplier-form-basic">
          <MasterFormCol>
            <ProFormText
              name="supplierCode"
              label="供应商编码"
              placeholder="VEND-0001"
              readonly={codeReadOnly}
              extra={codeReadOnly ? '该供应商已被业务单据引用，编码不可修改' : undefined}
              fieldProps={{
                maxLength: SUPPLIER_CODE_MAX_LENGTH,
                onChange: (e) => {
                  const upper = e.target.value.toUpperCase()
                  if (upper.length <= SUPPLIER_CODE_MAX_LENGTH) {
                    formRef.current?.setFieldValue('supplierCode', upper)
                  }
                },
              }}
              rules={[
                { required: true, message: '供应商编码不能为空' },
                { min: SUPPLIER_CODE_MIN_LENGTH, message: '供应商编码至少 2 个字符' },
                {
                  pattern: SUPPLIER_CODE_PATTERN,
                  message: '供应商编码只允许大写字母、数字和连字符（-）',
                },
                {
                  validator: async (_, value) => {
                    if (codeReadOnly || !value) return
                    const dup = getSupplierByCode(String(value).trim(), existing?.id)
                    if (dup) throw new Error('供应商编码已存在')
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="supplierName"
              label="供应商名称"
              rules={[
                { required: true, message: '供应商名称不能为空' },
                { max: 50, message: '供应商名称最多 50 个字符' },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="contactName"
              label="联系人"
              rules={[
                { required: true, message: '联系人不能为空' },
                { max: 20, message: '联系人最多 20 个字符' },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="contactPhone"
              label="联系电话"
              fieldProps={{ maxLength: 20 }}
              rules={[
                { required: true, message: '联系电话不能为空' },
                { max: 20, message: '联系电话最多 20 个字符' },
                {
                  validator: async (_, value) => {
                    const phone = String(value ?? '').trim()
                    if (phone && !isValidContactPhone(phone)) {
                      throw new Error('请输入有效的手机号或座机号')
                    }
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol colProps={masterFormColFull}>
            <ProFormTextArea
              name="contactAddress"
              label="联系地址"
              fieldProps={{ maxLength: 100, rows: 3 }}
              rules={[{ max: 100, message: '联系地址最多 100 个字符' }]}
            />
          </MasterFormCol>
        </MasterFormSection>

        <MasterFormSection title="结算规则" data-anno="supplier-form-settlement">
          <MasterFormCol>
            <ProFormSelect
              name="settlementMethod"
              label="结算方式"
              options={SETTLEMENT_OPTIONS}
              rules={[{ required: true, message: '请选择结算方式' }]}
              fieldProps={{ ...masterFormControlProps, placeholder: '请选择' }}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormDependency name={['settlementMethod']}>
              {({ settlementMethod }) => (
                <ProFormText
                  name="paymentTermDays"
                  label="账期天数"
                  readonly={settlementMethod === 'CASH'}
                  extra={settlementMethod === 'CASH' ? '现付时账期天数固定为 0' : undefined}
                  fieldProps={{
                    value: settlementMethod === 'CASH' ? '0' : undefined,
                  }}
                  rules={[
                    {
                      validator: async (_, value) => {
                        if (settlementMethod !== 'ACCOUNT') return
                        const termRaw = String(value ?? '').trim()
                        if (!termRaw) throw new Error('账期天数不能为空')
                        if (!/^\d+$/.test(termRaw)) throw new Error('账期天数须为 0-365 的整数')
                        const days = Number(termRaw)
                        if (days < 0 || days > 365) throw new Error('账期天数须为 0-365 的整数')
                      },
                    },
                  ]}
                />
              )}
            </ProFormDependency>
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="taxRate"
              label="税率"
              placeholder="如 13%、未税"
              fieldProps={{ maxLength: 10 }}
              rules={[{ max: 10, message: '税率最多 10 个字符' }]}
            />
          </MasterFormCol>
          <MasterFormCol colProps={masterFormColFull}>
            <ProFormTextArea
              name="remark"
              label="供应商备注"
              fieldProps={{ maxLength: 200, rows: 4 }}
              rules={[{ max: 200, message: '供应商备注最多 200 个字符' }]}
            />
          </MasterFormCol>
        </MasterFormSection>
      </ProForm>

      {isEdit && existing ? (
        <Card title="系统信息" size="small" style={{ marginBottom: 16 }} data-anno="supplier-form-system">
          <Space direction="vertical" size="small">
            <Typography.Text>
              <Typography.Text type="secondary">创建人 </Typography.Text>
              {existing.createdBy}
            </Typography.Text>
            <Typography.Text>
              <Typography.Text type="secondary">创建时间 </Typography.Text>
              {formatDateTime(existing.createdAt)}
            </Typography.Text>
            <Typography.Text>
              <Typography.Text type="secondary">最后修改人 </Typography.Text>
              {existing.updatedBy}
            </Typography.Text>
            <Typography.Text>
              <Typography.Text type="secondary">最后修改时间 </Typography.Text>
              {formatDateTime(existing.updatedAt)}
            </Typography.Text>
          </Space>
        </Card>
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function SupplierNew() {
  return <SupplierFormPage isEdit={false} />
}

export function SupplierEdit() {
  return <SupplierFormPage isEdit={true} />
}
