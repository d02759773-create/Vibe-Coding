import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Space, Typography } from 'antd'
import { Button } from '@/components/ui/button'
import { DetailFieldRow, DetailSection } from '@/components/detail/DetailSection'
import { StatusPill } from '@/components/StatusPill'
import { EnableDisableModal } from '@/components/master/EnableDisableModal'
import { Toast } from '@/components/Toast'
import { displayValue, formatDateTime } from '@/features/products/format'
import { settlementLabel } from '@/features/suppliers/constants'
import {
  getSupplierById,
  listSuppliers,
  persistSuppliers,
} from '@/features/suppliers/storage'
import type { SupplierStatus } from '@/features/suppliers/types'

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function SupplierDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const supplier = useMemo(() => {
    void refreshKey
    return id ? getSupplierById(id) : undefined
  }, [id, refreshKey])

  if (!supplier) {
    return (
      <PageContainer title="供应商详情">
        <Typography.Text type="secondary">未找到供应商档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  function confirmStatusChange() {
    if (!statusAction || !supplier) return
    const current = supplier
    const all = listSuppliers()

    if (statusAction === 'disable') {
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      if (reason.length > 100) {
        setDisableReasonError('停用原因最多 100 个字符')
        return
      }
      persistSuppliers(
        all.map((s) =>
          s.id === current.id
            ? {
                ...s,
                status: 'DISABLED' as SupplierStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : s,
        ),
      )
      setToast('供应商已停用')
    } else {
      persistSuppliers(
        all.map((s) =>
          s.id === current.id
            ? {
                ...s,
                status: 'ENABLED' as SupplierStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : s,
        ),
      )
      setToast('供应商已启用')
    }

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  const disableReasonDisplay =
    supplier.status === 'DISABLED' ? displayValue(supplier.disableReason) : '-'

  return (
    <PageContainer
      title="供应商详情"
      subTitle={supplier.supplierCode}
      tags={<StatusPill status={supplier.status} />}
      data-anno="supplier-detail-page"
      extra={
        <Space wrap data-anno="supplier-detail-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/master/suppliers')}>
            返回列表
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/master/suppliers/${supplier.id}/edit`)}
          >
            编辑
          </Button>
          {supplier.status === 'ENABLED' ? (
            <Button type="button" variant="destructive" onClick={() => setStatusAction('disable')}>
              停用
            </Button>
          ) : (
            <Button type="button" onClick={() => setStatusAction('enable')}>
              启用
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }} data-anno="supplier-detail-sections">
        <DetailSection title="供应商资料">
          <DetailFieldRow label="供应商编码" value={supplier.supplierCode} />
          <DetailFieldRow label="供应商名称" value={supplier.supplierName} />
          <DetailFieldRow label="联系人" value={supplier.contactName} />
          <DetailFieldRow label="联系电话" value={supplier.contactPhone} />
          <DetailFieldRow label="联系地址" value={displayValue(supplier.contactAddress)} />
        </DetailSection>

        <DetailSection title="结算规则">
          <DetailFieldRow label="结算方式" value={settlementLabel(supplier.settlementMethod)} />
          <DetailFieldRow label="账期天数" value={supplier.paymentTermDays} />
          <DetailFieldRow label="税率" value={displayValue(supplier.taxRate)} />
          <DetailFieldRow label="供应商备注" value={displayValue(supplier.remark)} />
        </DetailSection>

        <DetailSection title="补充信息">
          <DetailFieldRow label="停用原因" value={disableReasonDisplay} />
        </DetailSection>

        <DetailSection title="系统信息">
          <DetailFieldRow label="创建人" value={supplier.createdBy} />
          <DetailFieldRow label="创建时间" value={formatDateTime(supplier.createdAt)} />
          <DetailFieldRow label="最后修改人" value={supplier.updatedBy} />
          <DetailFieldRow label="最后修改时间" value={formatDateTime(supplier.updatedAt)} />
        </DetailSection>
      </Space>

      <EnableDisableModal
        dataAnno="supplier-status-modal"
        open={statusAction !== null}
        mode={statusAction ?? 'disable'}
        entityLabel="供应商"
        maxReasonLength={100}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        enableHint="启用后供应商可再次被采购等业务单据引用。"
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
