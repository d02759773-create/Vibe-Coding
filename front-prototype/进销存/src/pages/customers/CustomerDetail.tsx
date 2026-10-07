import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Space, Typography } from 'antd'
import { Button } from '@/components/ui/button'
import { DetailFieldRow, DetailSection } from '@/components/detail/DetailSection'
import { StatusPill } from '@/components/StatusPill'
import { EnableDisableModal } from '@/components/master/EnableDisableModal'
import { Toast } from '@/components/Toast'
import {
  customerGradeLabel,
  customerTypeLabel,
  settlementLabel,
} from '@/features/customers/constants'
import { getRealtimeReceivable } from '@/features/customers/receivable'
import {
  getCustomerById,
  listCustomers,
  persistCustomers,
} from '@/features/customers/storage'
import type { CustomerStatus } from '@/features/customers/types'
import { displayValue, formatDateTime, formatMoney } from '@/features/products/format'

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function moneyDisplay(value: number) {
  return `¥${formatMoney(value)}`
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const customer = useMemo(() => {
    void refreshKey
    return id ? getCustomerById(id) : undefined
  }, [id, refreshKey])

  if (!customer) {
    return (
      <PageContainer title="客户详情">
        <Typography.Text type="secondary">未找到客户档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  const receivable = getRealtimeReceivable(customer.id)
  const fullAddress = [customer.province, customer.city, customer.district, customer.detailAddress]
    .filter(Boolean)
    .join(' ')

  function tryOpenDisable() {
    if (!customer) return
    if (getRealtimeReceivable(customer.id) > 0) {
      setToast('该客户仍有未结清应收，请先收款或对账后再禁用')
      return
    }
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function confirmStatusChange() {
    if (!statusAction || !customer) return
    const current = customer
    const all = listCustomers()

    if (statusAction === 'disable') {
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      if (reason.length > 200) {
        setDisableReasonError('停用原因最多 200 个字符')
        return
      }
      persistCustomers(
        all.map((c) =>
          c.id === current.id
            ? {
                ...c,
                status: 'DISABLED' as CustomerStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : c,
        ),
      )
      setToast('客户已停用')
    } else {
      persistCustomers(
        all.map((c) =>
          c.id === current.id
            ? {
                ...c,
                status: 'ENABLED' as CustomerStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : c,
        ),
      )
      setToast('客户已启用')
    }

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  const disableReasonDisplay =
    customer.status === 'DISABLED' ? displayValue(customer.disableReason) : '-'

  return (
    <PageContainer
      title="客户详情"
      subTitle={customer.customerCode}
      tags={<StatusPill status={customer.status} />}
      data-anno="customer-detail-page"
      extra={
        <Space wrap data-anno="customer-detail-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/master/customers')}>
            返回列表
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/master/customers/${customer.id}/edit`)}
          >
            编辑
          </Button>
          {customer.status === 'ENABLED' ? (
            <Button type="button" variant="destructive" onClick={tryOpenDisable}>
              禁用
            </Button>
          ) : (
            <Button type="button" onClick={() => setStatusAction('enable')}>
              启用
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }} data-anno="customer-detail-sections">
        <DetailSection title="基础识别信息">
          <DetailFieldRow label="客户编码" value={customer.customerCode} />
          <DetailFieldRow label="客户名称" value={customer.customerName} />
          <DetailFieldRow label="客户类型" value={customerTypeLabel(customer.customerType)} />
          <DetailFieldRow label="客户等级" value={customerGradeLabel(customer.customerGrade)} />
          <DetailFieldRow label="联系人" value={customer.contactName} />
          <DetailFieldRow label="联系电话" value={customer.contactPhone} />
          <DetailFieldRow label="省份" value={customer.province} />
          <DetailFieldRow label="城市" value={customer.city} />
          <DetailFieldRow label="区/县" value={customer.district} />
          <DetailFieldRow label="详细地址" value={displayValue(customer.detailAddress)} />
          <DetailFieldRow label="完整地址" value={fullAddress || '-'} />
          <DetailFieldRow label="启停用状态" value={<StatusPill status={customer.status} />} />
        </DetailSection>

        <DetailSection title="经营与结算信息">
          <DetailFieldRow label="归属业务员" value={displayValue(customer.salesperson)} />
          <DetailFieldRow label="期初欠款" value={moneyDisplay(customer.openingArrears)} />
          <DetailFieldRow label="期初余额" value={moneyDisplay(customer.openingBalance)} />
          <DetailFieldRow label="结算方式" value={settlementLabel(customer.settlementMethod)} />
          <DetailFieldRow label="账期天数" value={customer.paymentTermDays} />
          <DetailFieldRow label="信用额度" value={moneyDisplay(customer.creditLimit)} />
          <DetailFieldRow label="客户备注" value={displayValue(customer.remark)} />
          <DetailFieldRow
            label="实时应收余额"
            value={
              <Typography.Text type="secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {moneyDisplay(receivable)}（往来模块 Demo 计算，非档案存储）
              </Typography.Text>
            }
          />
        </DetailSection>

        <DetailSection title="补充信息">
          <DetailFieldRow label="停用原因" value={disableReasonDisplay} />
        </DetailSection>

        <DetailSection title="系统信息">
          <DetailFieldRow label="创建人" value={customer.createdBy} />
          <DetailFieldRow label="创建时间" value={formatDateTime(customer.createdAt)} />
          <DetailFieldRow label="最后修改人" value={customer.updatedBy} />
          <DetailFieldRow label="最后修改时间" value={formatDateTime(customer.updatedAt)} />
        </DetailSection>
      </Space>

      <EnableDisableModal
        dataAnno="customer-status-modal"
        open={statusAction !== null}
        mode={statusAction ?? 'disable'}
        entityLabel="客户"
        maxReasonLength={200}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        enableHint="启用后客户可再次被销售等业务单据引用。"
        onReasonChange={(v) => {
          setDisableReason(v)
          if (disableReasonError) setDisableReasonError('')
        }}
        onClose={() => {
          setStatusAction(null)
          setDisableReason('')
          setDisableReasonError('')
        }}
        onConfirm={confirmStatusChange}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
