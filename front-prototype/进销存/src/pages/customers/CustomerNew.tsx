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

type FormValues = {
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

const emptyForm: FormValues = {
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

function customerToForm(c: Customer): FormValues {
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

function parseMoneyField(raw: string, fieldLabel: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`${fieldLabel}格式不正确`)
  }
  const n = Number(trimmed)
  if (n < 0) throw new Error(`${fieldLabel}不能为负数`)
  return Math.round(n * 100) / 100
}

function CustomerFormPage({ isEdit }: { isEdit: boolean }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const formRef = useRef<ProFormInstance<FormValues>>(null)
  const existing = useMemo(() => (isEdit && id ? getCustomerById(id) : undefined), [isEdit, id])
  const [toast, setToast] = useState<string | null>(null)

  const initialValues = useMemo(
    () => (existing ? customerToForm(existing) : emptyForm),
    [existing],
  )

  if (isEdit && !existing) {
    return (
      <PageContainer title="编辑客户">
        <Typography.Text type="secondary">未找到客户档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  const codeReadOnly = Boolean(isEdit && existing?.isReferenced)

  async function handleFinish(values: FormValues) {
    const openingArrears = parseMoneyField(values.openingArrears, '期初欠款') ?? 0
    const openingBalance = parseMoneyField(values.openingBalance, '期初余额') ?? 0
    const creditLimit = parseMoneyField(values.creditLimit, '信用额度') ?? 0
    const paymentTermDays =
      values.settlementMethod === 'CASH' ? 0 : Number(String(values.paymentTermDays).trim())
    const timestamp = nowString()

    if (isEdit && existing) {
      upsertCustomer({
        ...existing,
        customerCode: existing.isReferenced ? existing.customerCode : values.customerCode.trim(),
        customerName: values.customerName.trim(),
        customerType: values.customerType as CustomerType,
        customerGrade: values.customerGrade as CustomerGrade,
        contactName: values.contactName.trim(),
        contactPhone: values.contactPhone.trim(),
        province: values.province,
        city: values.city,
        district: values.district,
        detailAddress: values.detailAddress.trim() || null,
        salesperson: values.salesperson.trim() || null,
        openingArrears,
        openingBalance,
        settlementMethod: values.settlementMethod as SettlementMethod,
        paymentTermDays,
        creditLimit,
        remark: values.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertCustomer({
        id: nextCustomerId(),
        customerCode: values.customerCode.trim(),
        customerName: values.customerName.trim(),
        customerType: values.customerType as CustomerType,
        customerGrade: values.customerGrade as CustomerGrade,
        contactName: values.contactName.trim(),
        contactPhone: values.contactPhone.trim(),
        province: values.province,
        city: values.city,
        district: values.district,
        detailAddress: values.detailAddress.trim() || null,
        salesperson: values.salesperson.trim() || null,
        openingArrears,
        openingBalance,
        settlementMethod: values.settlementMethod as SettlementMethod,
        paymentTermDays,
        creditLimit,
        remark: values.remark.trim() || null,
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
    <PageContainer
      title={isEdit ? '编辑客户' : '新增客户'}
      extra={
        <Space>
          <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
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
          if ('province' in changed) {
            formRef.current?.setFieldsValue({ city: '', district: '' })
          }
          if ('city' in changed) {
            formRef.current?.setFieldsValue({ district: '' })
          }
          if (changed.settlementMethod === 'CASH') {
            formRef.current?.setFieldsValue({ paymentTermDays: '0' })
          }
        }}
      >
        <MasterFormSection title="基础识别信息">
          <MasterFormCol>
            <ProFormText
              name="customerCode"
              label="客户编码"
              placeholder="建议格式: CUST-0001"
              readonly={codeReadOnly}
              rules={[
                { required: true, message: '客户编码不能为空' },
                {
                  min: CUSTOMER_CODE_MIN_LENGTH,
                  max: CUSTOMER_CODE_MAX_LENGTH,
                  message: `客户编码须为 ${CUSTOMER_CODE_MIN_LENGTH}–${CUSTOMER_CODE_MAX_LENGTH} 个字符`,
                },
                {
                  validator: async (_, value) => {
                    if (codeReadOnly || !value) return
                    const dup = getCustomerByCode(String(value).trim(), existing?.id)
                    if (dup) throw new Error('客户编码已存在')
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="customerName"
              label="客户名称"
              placeholder="请输入客户名称"
              rules={[
                { required: true, message: '客户名称不能为空' },
                { max: 100, message: '客户名称最多 100 个字符' },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormSelect
              name="customerType"
              label="客户类型"
              options={CUSTOMER_TYPE_OPTIONS}
              rules={[{ required: true, message: '请选择客户类型' }]}
              fieldProps={{ ...masterFormControlProps, placeholder: '请选择' }}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormSelect
              name="customerGrade"
              label="客户等级"
              options={CUSTOMER_GRADE_OPTIONS}
              rules={[{ required: true, message: '请选择客户等级' }]}
              fieldProps={{ ...masterFormControlProps, placeholder: '请选择' }}
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
          <MasterFormCol>
            <ProFormSelect
              name="province"
              label="省份"
              options={PROVINCES.map((p) => ({ label: p, value: p }))}
              rules={[{ required: true, message: '请选择省份' }]}
              fieldProps={{ ...masterFormControlProps, placeholder: '请选择省份', showSearch: true }}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormDependency name={['province']}>
              {({ province }) => (
                <ProFormSelect
                  name="city"
                  label="城市"
                  options={citiesOfProvince(province ?? '').map((c) => ({ label: c, value: c }))}
                  rules={[{ required: true, message: '请选择城市' }]}
                  fieldProps={{
                    ...masterFormControlProps,
                    placeholder: province ? '请选择城市' : '请先选择省份',
                    disabled: !province,
                    showSearch: true,
                  }}
                />
              )}
            </ProFormDependency>
          </MasterFormCol>
          <MasterFormCol>
            <ProFormDependency name={['province', 'city']}>
              {({ province, city }) => (
                <ProFormSelect
                  name="district"
                  label="区/县"
                  options={districtsOf(province ?? '', city ?? '').map((d) => ({
                    label: d,
                    value: d,
                  }))}
                  rules={[{ required: true, message: '请选择区/县' }]}
                  fieldProps={{
                    ...masterFormControlProps,
                    placeholder: city ? '请选择区/县' : '请先选择城市',
                    disabled: !city,
                    showSearch: true,
                  }}
                />
              )}
            </ProFormDependency>
          </MasterFormCol>
          <MasterFormCol colProps={masterFormColFull}>
            <ProFormText
              name="detailAddress"
              label="详细地址"
              placeholder="请输入街道、门牌号等详细地址"
              rules={[{ max: 200, message: '详细地址最多 200 个字符' }]}
            />
          </MasterFormCol>
        </MasterFormSection>

        <MasterFormSection title="经营与结算信息">
          <MasterFormCol>
            <ProFormText name="salesperson" label="归属业务员" placeholder="请输入归属业务员" />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="openingArrears"
              label="期初欠款"
              fieldProps={{ inputMode: 'decimal' }}
              rules={[
                {
                  validator: async (_, value) => {
                    parseMoneyField(String(value ?? ''), '期初欠款')
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="openingBalance"
              label="期初余额"
              fieldProps={{ inputMode: 'decimal' }}
              rules={[
                {
                  validator: async (_, value) => {
                    parseMoneyField(String(value ?? ''), '期初余额')
                  },
                },
              ]}
            />
          </MasterFormCol>
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
                  fieldProps={{
                    value: settlementMethod === 'CASH' ? '0' : undefined,
                  }}
                  rules={[
                    {
                      validator: async (_, value) => {
                        if (settlementMethod !== 'ACCOUNT') return
                        const termRaw = String(value ?? '').trim()
                        if (!termRaw) throw new Error('请填写账期天数')
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
              name="creditLimit"
              label="信用额度"
              extra="0 表示不启用销售硬控"
              fieldProps={{ inputMode: 'decimal' }}
              rules={[
                {
                  validator: async (_, value) => {
                    parseMoneyField(String(value ?? ''), '信用额度')
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol colProps={masterFormColFull}>
            <ProFormTextArea
              name="remark"
              label="客户备注"
              placeholder="记录补充信息或特殊合作说明"
              fieldProps={{ maxLength: 200, rows: 3 }}
              rules={[{ max: 200, message: '客户备注最多 200 个字符' }]}
            />
          </MasterFormCol>
        </MasterFormSection>
      </ProForm>

      {isEdit && existing ? (
        <Card title="系统信息" size="small" style={{ marginBottom: 16 }}>
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

export function CustomerNew() {
  return <CustomerFormPage isEdit={false} />
}

export function CustomerEdit() {
  return <CustomerFormPage isEdit={true} />
}
