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
import {
  displayServiceProvider,
  logisticsTypeLabel,
} from '@/features/logistics/constants'
import {
  getLogisticsById,
  getMockOpenOutboundCount,
  listLogistics,
  persistLogistics,
} from '@/features/logistics/storage'
import type { LogisticsStatus } from '@/features/logistics/types'

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function LogisticsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const item = useMemo(() => {
    void refreshKey
    return id ? getLogisticsById(id) : undefined
  }, [id, refreshKey])

  if (!item) {
    return (
      <PageContainer title="物流详情">
        <Typography.Text type="secondary">未找到物流档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/logistics')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  function confirmStatusChange() {
    if (!statusAction || !item) return
    const current = item
    const all = listLogistics()

    if (statusAction === 'disable') {
      if (getMockOpenOutboundCount(current.id) > 0) {
        setToast('存在未完结的销售出库单引用该物流方式，请先处理后再禁用')
        return
      }
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      const ts = nowString()
      persistLogistics(
        all.map((row) =>
          row.id === current.id
            ? {
                ...row,
                status: 'DISABLED' as LogisticsStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: ts,
                disabledBy: '管理员',
                disabledAt: ts,
              }
            : row,
        ),
      )
      setToast('物流方式已禁用')
    } else {
      const ts = nowString()
      persistLogistics(
        all.map((row) =>
          row.id === current.id
            ? {
                ...row,
                status: 'ENABLED' as LogisticsStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: ts,
                enabledBy: '管理员',
                enabledAt: ts,
              }
            : row,
        ),
      )
      setToast('物流方式已启用')
    }

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  return (
    <PageContainer
      title="物流详情"
      subTitle={item.logisticsCode}
      tags={<StatusPill status={item.status} disabledLabel="禁用" />}
      extra={
        <Space wrap data-anno="logistics-detail-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/master/logistics')}>
            返回列表
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/master/logistics/${item.id}/edit`)}>
            编辑
          </Button>
          {item.status === 'ENABLED' ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (getMockOpenOutboundCount(item.id) > 0) {
                  setToast('存在未完结的销售出库单引用该物流方式，请先处理后再禁用')
                  return
                }
                setStatusAction('disable')
              }}
            >
              禁用
            </Button>
          ) : (
            <Button type="button" onClick={() => setStatusAction('enable')}>
              启用
            </Button>
          )}
        </Space>
      }
      data-anno="logistics-detail-page"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }} data-anno="logistics-detail-sections">
        <DetailSection title="基础识别信息">
        <DetailFieldRow label="物流编码" value={item.logisticsCode} />
        <DetailFieldRow label="物流名称" value={item.logisticsName} />
        <DetailFieldRow label="物流类型" value={logisticsTypeLabel(item.logisticsType)} />
        <DetailFieldRow label="物流服务商" value={displayServiceProvider(item.serviceProvider)} />
        <DetailFieldRow label="物流备注" value={displayValue(item.remark)} />
        <DetailFieldRow
          label="使用状态"
          value={<StatusPill status={item.status} disabledLabel="禁用" />}
        />
        <DetailFieldRow
          label="停用原因"
          value={item.status === 'DISABLED' ? displayValue(item.disableReason) : '-'}
        />
      </DetailSection>

      <DetailSection title="系统信息">
        <DetailFieldRow label="创建人" value={item.createdBy} />
        <DetailFieldRow label="创建时间" value={formatDateTime(item.createdAt)} />
        <DetailFieldRow label="最后修改人" value={item.updatedBy} />
        <DetailFieldRow label="最后修改时间" value={formatDateTime(item.updatedAt)} />
        <DetailFieldRow label="禁用人" value={displayValue(item.disabledBy)} />
        <DetailFieldRow label="禁用时间" value={item.disabledAt ? formatDateTime(item.disabledAt) : '-'} />
        <DetailFieldRow label="启用人" value={displayValue(item.enabledBy)} />
        <DetailFieldRow label="启用时间" value={item.enabledAt ? formatDateTime(item.enabledAt) : '-'} />
      </DetailSection>
      </Space>

      <EnableDisableModal
        dataAnno="logistics-status-modal"
        open={Boolean(statusAction)}
        mode={statusAction ?? 'disable'}
        entityLabel="物流方式"
        maxReasonLength={200}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        enableHint="启用后该物流方式可再次被业务单据引用。"
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
