import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageContainer,
  ProForm,
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

type FormValues = {
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

const emptyForm: FormValues = {
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

function productToForm(product: Product): FormValues {
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

function ProductFormPage({ isEdit }: { isEdit: boolean }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const formRef = useRef<ProFormInstance<FormValues>>(null)
  const existing = useMemo(
    () => (isEdit && id ? getProductById(id) : undefined),
    [isEdit, id],
  )
  const [toast, setToast] = useState<string | null>(null)

  const initialValues = useMemo(
    () => (existing ? productToForm(existing) : emptyForm),
    [existing],
  )

  if (isEdit && !existing) {
    return (
      <PageContainer title="编辑商品">
        <Typography.Text type="secondary">未找到商品档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  const codeReadOnly = Boolean(isEdit && existing?.isReferenced)

  async function handleFinish(values: FormValues) {
    const wholesale = parseRequiredPrice(values.defaultWholesalePrice)!
    const retail = parseOptionalPrice(values.defaultRetailPrice)
    const purchase = parseOptionalPrice(values.referencePurchasePrice)
    const timestamp = nowString()

    if (isEdit && existing) {
      upsertProduct({
        ...existing,
        productCode: existing.isReferenced ? existing.productCode : values.productCode.trim(),
        productName: values.productName.trim(),
        category: values.category,
        specModel: values.specModel.trim(),
        salesUnit: values.salesUnit as SalesUnit,
        barcode: values.barcode.trim() || null,
        defaultRetailPrice: retail,
        defaultWholesalePrice: wholesale,
        referencePurchasePrice: purchase,
        remark: values.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertProduct({
        id: nextProductId(),
        productCode: values.productCode.trim(),
        productName: values.productName.trim(),
        category: values.category,
        specModel: values.specModel.trim(),
        salesUnit: values.salesUnit as SalesUnit,
        barcode: values.barcode.trim() || null,
        defaultRetailPrice: retail,
        defaultWholesalePrice: wholesale,
        referencePurchasePrice: purchase,
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
    setTimeout(() => navigate('/master/products'), 400)
  }

  return (
    <PageContainer
      title={isEdit ? '编辑商品' : '新增商品'}
      data-anno="product-form-page"
      extra={
        <Space data-anno="product-form-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
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
      >
        <MasterFormSection title="基础资料" data-anno="product-form-basic">
          <MasterFormCol>
            <ProFormText
              name="productCode"
              label="商品编码"
              placeholder="SKU-0001"
              readonly={codeReadOnly}
              extra={codeReadOnly ? '该商品已被业务单据引用，编码不可修改' : undefined}
              fieldProps={{
                maxLength: PRODUCT_CODE_MAX_LENGTH,
                onChange: (e) => {
                  const upper = e.target.value.toUpperCase()
                  if (upper.length <= PRODUCT_CODE_MAX_LENGTH) {
                    formRef.current?.setFieldValue('productCode', upper)
                  }
                },
              }}
              rules={[
                { required: true, message: '商品编码不能为空' },
                { min: PRODUCT_CODE_MIN_LENGTH, message: '商品编码至少 2 个字符' },
                {
                  pattern: PRODUCT_CODE_PATTERN,
                  message: '商品编码只允许大写字母、数字和连字符（-）',
                },
                {
                  validator: async (_, value) => {
                    if (codeReadOnly || !value) return
                    const dup = getProductByCode(String(value).trim(), existing?.id)
                    if (dup) throw new Error('商品编码已存在')
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="productName"
              label="商品名称"
              rules={[
                { required: true, message: '商品名称不能为空' },
                { max: 50, message: '商品名称最多 50 个字符' },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormSelect
              name="category"
              label="商品分类"
              options={PRODUCT_CATEGORIES.map((c) => ({ label: c, value: c }))}
              rules={[{ required: true, message: '请选择商品分类' }]}
              fieldProps={{ ...masterFormControlProps, placeholder: '请选择' }}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormSelect
              name="salesUnit"
              label="销售单位"
              options={SALES_UNIT_OPTIONS}
              rules={[{ required: true, message: '请选择销售单位' }]}
              fieldProps={{ ...masterFormControlProps, placeholder: '请选择' }}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="specModel"
              label="规格型号"
              rules={[
                { required: true, message: '规格型号不能为空' },
                { max: 100, message: '规格型号最多 100 个字符' },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="barcode"
              label="条码"
              fieldProps={{ maxLength: 30 }}
              rules={[
                { max: 30, message: '条码最多 30 个字符' },
                {
                  validator: async (_, value) => {
                    const barcode = String(value ?? '').trim()
                    if (!barcode) return
                    const dup = getProductByBarcode(barcode, existing?.id)
                    if (dup) throw new Error('商品条码已存在')
                  },
                },
              ]}
            />
          </MasterFormCol>
        </MasterFormSection>

        <MasterFormSection title="价格与说明" data-anno="product-form-price">
          <MasterFormCol>
            <ProFormText
              name="defaultRetailPrice"
              label="默认零售价"
              placeholder="选填"
              fieldProps={{ inputMode: 'decimal' }}
              rules={[
                {
                  validator: async (_, value) => {
                    const raw = String(value ?? '').trim()
                    if (!raw) return
                    if (parseOptionalPrice(raw) === null) {
                      throw new Error('默认零售价须 ≥ 0，保留 2 位小数')
                    }
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="defaultWholesalePrice"
              label="默认批发价"
              fieldProps={{ inputMode: 'decimal' }}
              rules={[
                {
                  validator: async (_, value) => {
                    if (parseRequiredPrice(String(value ?? '')) === null) {
                      throw new Error('默认批发价必填且须 ≥ 0')
                    }
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="referencePurchasePrice"
              label="参考采购价"
              placeholder="选填"
              fieldProps={{ inputMode: 'decimal' }}
              rules={[
                {
                  validator: async (_, value) => {
                    const raw = String(value ?? '').trim()
                    if (!raw) return
                    if (parseOptionalPrice(raw) === null) {
                      throw new Error('参考采购价须 ≥ 0，保留 2 位小数')
                    }
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol colProps={masterFormColFull}>
            <ProFormTextArea
              name="remark"
              label="商品备注"
              fieldProps={{ maxLength: 200, rows: 4 }}
              rules={[{ max: 200, message: '商品备注最多 200 个字符' }]}
            />
          </MasterFormCol>
        </MasterFormSection>
      </ProForm>

      {isEdit && existing ? (
        <Card title="系统信息" size="small" style={{ marginBottom: 16 }} data-anno="product-form-system">
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

export function ProductNew() {
  return <ProductFormPage isEdit={false} />
}

export function ProductEdit() {
  return <ProductFormPage isEdit={true} />
}
