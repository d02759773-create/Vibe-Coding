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
import { Card, Form, Space, Typography } from 'antd'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import {
  MasterFormCol,
  MasterFormSection,
  masterFormColFull,
  masterFormControlProps,
} from '@/lib/masterFormLayout'
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

type FormValues = {
  warehouseCode: string
  warehouseName: string
  warehouseType: WarehouseType | ''
  address: string
  managerName: string
  contactPhone: string
  remark: string
}

const emptyForm: FormValues = {
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

function warehouseToForm(w: Warehouse): FormValues {
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

function WarehouseFormPage({ isEdit }: { isEdit: boolean }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const formRef = useRef<ProFormInstance<FormValues>>(null)
  const existing = useMemo(
    () => (isEdit && id ? getWarehouseById(id) : undefined),
    [isEdit, id],
  )
  const [toast, setToast] = useState<string | null>(null)

  const initialValues = useMemo(
    () => (existing ? warehouseToForm(existing) : emptyForm),
    [existing],
  )

  if (isEdit && !existing) {
    return (
      <PageContainer title="编辑仓库">
        <Typography.Text type="secondary">未找到仓库档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  const codeReadOnly = Boolean(isEdit && existing?.isReferenced)

  async function handleFinish(values: FormValues) {
    const timestamp = nowString()

    if (isEdit && existing) {
      upsertWarehouse({
        ...existing,
        warehouseCode: existing.isReferenced ? existing.warehouseCode : values.warehouseCode.trim(),
        warehouseName: values.warehouseName.trim(),
        warehouseType: existing.warehouseType,
        address: values.address.trim(),
        managerName: values.managerName.trim(),
        contactPhone: values.contactPhone.trim() || null,
        remark: values.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertWarehouse({
        id: nextWarehouseId(),
        warehouseCode: values.warehouseCode.trim(),
        warehouseName: values.warehouseName.trim(),
        warehouseType: values.warehouseType as WarehouseType,
        address: values.address.trim(),
        managerName: values.managerName.trim(),
        contactPhone: values.contactPhone.trim() || null,
        remark: values.remark.trim() || null,
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
    setTimeout(() => navigate('/master/warehouses'), 400)
  }

  const warehouseTypeLabel =
    WAREHOUSE_TYPE_OPTIONS.find((o) => o.value === existing?.warehouseType)?.label ?? ''

  return (
    <PageContainer
      title={isEdit ? '编辑仓库' : '新增仓库'}
      data-anno="warehouse-form-page"
      extra={
        <Space data-anno="warehouse-form-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
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
        <MasterFormSection title="基础资料" data-anno="warehouse-form-basic">
          <MasterFormCol>
            <ProFormText
              name="warehouseCode"
              label="仓库编码"
              placeholder="WH-CN-DG"
              readonly={codeReadOnly}
              extra={codeReadOnly ? '该仓库已被业务单据引用，编码不可修改' : undefined}
              fieldProps={{ maxLength: WAREHOUSE_CODE_MAX_LENGTH }}
              rules={[
                { required: true, message: '仓库编码不能为空' },
                {
                  min: WAREHOUSE_CODE_MIN_LENGTH,
                  max: WAREHOUSE_CODE_MAX_LENGTH,
                  message: `仓库编码须为 ${WAREHOUSE_CODE_MIN_LENGTH}–${WAREHOUSE_CODE_MAX_LENGTH} 个字符`,
                },
                {
                  validator: async (_, value) => {
                    if (codeReadOnly || !value) return
                    const dup = getWarehouseByCode(String(value).trim(), existing?.id)
                    if (dup) throw new Error('仓库编码已存在')
                  },
                },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="warehouseName"
              label="仓库名称"
              rules={[
                { required: true, message: '仓库名称不能为空' },
                { max: 50, message: '仓库名称最多 50 个字符' },
              ]}
            />
          </MasterFormCol>
          {isEdit ? (
            <MasterFormCol>
              <Form.Item label="仓库类型">
                <Typography.Text>{warehouseTypeLabel}</Typography.Text>
              </Form.Item>
            </MasterFormCol>
          ) : (
            <MasterFormCol>
              <ProFormSelect
                name="warehouseType"
                label="仓库类型"
                options={WAREHOUSE_TYPE_OPTIONS}
                rules={[{ required: true, message: '请选择仓库类型' }]}
                fieldProps={{ ...masterFormControlProps, placeholder: '请选择' }}
              />
            </MasterFormCol>
          )}
        </MasterFormSection>

        <MasterFormSection title="联系信息" data-anno="warehouse-form-contact">
          <MasterFormCol colProps={masterFormColFull}>
            <ProFormTextArea
              name="address"
              label="仓库地址"
              fieldProps={{ maxLength: 200, rows: 3 }}
              rules={[
                { required: true, message: '仓库地址不能为空' },
                { max: 200, message: '仓库地址最多 200 个字符' },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="managerName"
              label="负责人"
              rules={[
                { required: true, message: '负责人不能为空' },
                { max: 20, message: '负责人最多 20 个字符' },
              ]}
            />
          </MasterFormCol>
          <MasterFormCol>
            <ProFormText
              name="contactPhone"
              label="联系电话"
              fieldProps={{ maxLength: 20 }}
              rules={[
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
              name="remark"
              label="仓库备注"
              fieldProps={{ maxLength: 200, rows: 4 }}
              rules={[{ max: 200, message: '仓库备注最多 200 个字符' }]}
            />
          </MasterFormCol>
        </MasterFormSection>
      </ProForm>

      {isEdit && existing ? (
        <Card
          title="系统信息"
          size="small"
          style={{ marginBottom: 16 }}
          data-anno="warehouse-form-system"
        >
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

export function WarehouseNew() {
  return <WarehouseFormPage isEdit={false} />
}

export function WarehouseEdit() {
  return <WarehouseFormPage isEdit={true} />
}
