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
import { LOGISTICS_TYPE_OPTIONS } from '@/features/logistics/constants'
import {
  getLogisticsById,
  nextLogisticsCode,
  nextLogisticsId,
  upsertLogistics,
} from '@/features/logistics/storage'
import type { Logistics, LogisticsType } from '@/features/logistics/types'

type FormValues = {
  logisticsName: string
  logisticsType: LogisticsType | ''
  serviceProvider: string
  remark: string
}

const emptyForm: FormValues = {
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

function toForm(row: Logistics): FormValues {
  return {
    logisticsName: row.logisticsName,
    logisticsType: row.logisticsType,
    serviceProvider: row.serviceProvider ?? '',
    remark: row.remark ?? '',
  }
}

function LogisticsFormPage({ isEdit }: { isEdit: boolean }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const formRef = useRef<ProFormInstance<FormValues>>(null)
  const existing = useMemo(
    () => (isEdit && id ? getLogisticsById(id) : undefined),
    [isEdit, id],
  )
  const [toast, setToast] = useState<string | null>(null)

  const initialValues = useMemo(() => (existing ? toForm(existing) : emptyForm), [existing])

  if (isEdit && !existing) {
    return (
      <PageContainer title="编辑物流">
        <Typography.Text type="secondary">未找到物流档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/logistics')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  const logisticsTypeLabel =
    LOGISTICS_TYPE_OPTIONS.find((o) => o.value === existing?.logisticsType)?.label ?? ''

  async function handleFinish(values: FormValues) {
    const timestamp = nowString()

    if (isEdit && existing) {
      upsertLogistics({
        ...existing,
        logisticsName: values.logisticsName.trim(),
        logisticsType: existing.logisticsType,
        serviceProvider: values.serviceProvider.trim() || null,
        remark: values.remark.trim() || null,
        updatedBy: '管理员',
        updatedAt: timestamp,
      })
    } else {
      upsertLogistics({
        id: nextLogisticsId(),
        logisticsCode: nextLogisticsCode(),
        logisticsName: values.logisticsName.trim(),
        logisticsType: values.logisticsType as LogisticsType,
        serviceProvider: values.serviceProvider.trim() || null,
        remark: values.remark.trim() || null,
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
    setTimeout(() => navigate('/master/logistics'), 400)
  }

  return (
    <PageContainer
      title={isEdit ? '编辑物流' : '新增物流'}
      data-anno="logistics-form-page"
      extra={
        <Space data-anno="logistics-form-header">
          <Button type="button" variant="outline" onClick={() => navigate('/master/logistics')}>
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
        <MasterFormSection title="基础识别信息" data-anno="logistics-form-basic">
          {!isEdit ? (
            <MasterFormCol colProps={masterFormColFull}>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                物流编码将在保存后由系统自动生成（LOG-xxxx）。
              </Typography.Paragraph>
            </MasterFormCol>
          ) : null}
          {isEdit && existing ? (
            <MasterFormCol>
              <Form.Item label="物流编码">
                <Typography.Text>{existing.logisticsCode}</Typography.Text>
              </Form.Item>
            </MasterFormCol>
          ) : null}
          <MasterFormCol>
            <ProFormText
              name="logisticsName"
              label="物流名称"
              placeholder="请输入物流名称"
              rules={[
                { required: true, message: '物流名称不能为空' },
                { max: 50, message: '物流名称最多 50 个字符' },
              ]}
            />
          </MasterFormCol>
          {isEdit ? (
            <MasterFormCol>
              <Form.Item label="物流类型">
                <Typography.Text>{logisticsTypeLabel}</Typography.Text>
              </Form.Item>
            </MasterFormCol>
          ) : (
            <MasterFormCol>
              <ProFormSelect
                name="logisticsType"
                label="物流类型"
                options={LOGISTICS_TYPE_OPTIONS}
                rules={[{ required: true, message: '请选择物流类型' }]}
                fieldProps={{ ...masterFormControlProps, placeholder: '请选择' }}
              />
            </MasterFormCol>
          )}
          <MasterFormCol>
            <ProFormText
              name="serviceProvider"
              label="物流服务商"
              placeholder="可填写顺丰/圆通/中通/韵达/申通/邮政/其他，或自定义"
              rules={[{ max: 50, message: '物流服务商最多 50 个字符' }]}
            />
          </MasterFormCol>
          <MasterFormCol colProps={masterFormColFull}>
            <ProFormTextArea
              name="remark"
              label="物流备注"
              placeholder="补充物流说明或特殊限制"
              fieldProps={{ maxLength: 200, rows: 4 }}
              rules={[{ max: 200, message: '物流备注最多 200 个字符' }]}
            />
          </MasterFormCol>
        </MasterFormSection>
      </ProForm>

      {isEdit && existing ? (
        <Card
          title="系统信息"
          size="small"
          style={{ marginBottom: 16 }}
          data-anno="logistics-form-system"
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

export function LogisticsNew() {
  return <LogisticsFormPage isEdit={false} />
}

export function LogisticsEdit() {
  return <LogisticsFormPage isEdit={true} />
}
