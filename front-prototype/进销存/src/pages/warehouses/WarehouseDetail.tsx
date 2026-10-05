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
import { warehouseTypeLabel } from '@/features/warehouses/constants'
import {
  getMockInventoryQty,
  getWarehouseById,
  listWarehouses,
  persistWarehouses,
} from '@/features/warehouses/storage'
import type { WarehouseStatus } from '@/features/warehouses/types'

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function WarehouseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const warehouse = useMemo(() => {
    void refreshKey
    return id ? getWarehouseById(id) : undefined
  }, [id, refreshKey])

  if (!warehouse) {
    return (
      <PageContainer title="仓库详情">
        <Typography.Text type="secondary">未找到仓库档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  const wh = warehouse

  function tryOpenDisable() {
    if (getMockInventoryQty(wh.id) > 0) {
      setToast('当前仓库仍有库存，请先处理后再停用')
      return
    }
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function confirmStatusChange() {
    if (!statusAction) return
    const all = listWarehouses()

    if (statusAction === 'disable') {
      if (getMockInventoryQty(wh.id) > 0) {
        setToast('当前仓库仍有库存，请先处理后再停用')
        return
      }
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      const ts = nowString()
      persistWarehouses(
        all.map((w) =>
          w.id === wh.id
            ? {
                ...w,
                status: 'DISABLED' as WarehouseStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: ts,
                disabledBy: '管理员',
                disabledAt: ts,
              }
            : w,
        ),
      )
      setToast('仓库已停用')
    } else {
      const ts = nowString()
      persistWarehouses(
        all.map((w) =>
          w.id === wh.id
            ? {
                ...w,
                status: 'ENABLED' as WarehouseStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: ts,
                enabledBy: '管理员',
                enabledAt: ts,
              }
            : w,
        ),
      )
      setToast('仓库已启用')
    }

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  const disableReasonDisplay = wh.status === 'DISABLED' ? displayValue(wh.disableReason) : '-'

  return (
    <PageContainer
      title="仓库详情"
      subTitle={wh.warehouseCode}
      tags={<StatusPill status={wh.status} />}
      extra={
        <Space wrap data-anno="warehouse-detail-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/master/warehouses')}>
            返回列表
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/master/warehouses/${wh.id}/edit`)}
          >
            编辑
          </Button>
          {wh.status === 'ENABLED' ? (
            <Button type="button" variant="destructive" onClick={tryOpenDisable}>
              停用
            </Button>
          ) : (
            <Button type="button" onClick={() => setStatusAction('enable')}>
              启用
            </Button>
          )}
        </Space>
      }
      data-anno="warehouse-detail-page"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }} data-anno="warehouse-detail-sections">
        <DetailSection title="基础资料">
          <DetailFieldRow label="仓库编码" value={wh.warehouseCode} />
          <DetailFieldRow label="仓库名称" value={wh.warehouseName} />
          <DetailFieldRow label="仓库类型" value={warehouseTypeLabel(wh.warehouseType)} />
          <DetailFieldRow label="启停用状态" value={<StatusPill status={wh.status} />} />
        </DetailSection>

        <DetailSection title="联系信息">
          <DetailFieldRow label="仓库地址" value={wh.address} />
          <DetailFieldRow label="负责人" value={wh.managerName} />
          <DetailFieldRow label="联系电话" value={displayValue(wh.contactPhone)} />
          <DetailFieldRow label="仓库备注" value={displayValue(wh.remark)} />
        </DetailSection>

        <DetailSection title="补充信息" data-anno="warehouse-status-modal">
          <DetailFieldRow label="停用原因" value={disableReasonDisplay} />
        </DetailSection>

        <DetailSection title="系统信息">
          <DetailFieldRow label="创建人" value={wh.createdBy} />
          <DetailFieldRow label="创建时间" value={formatDateTime(wh.createdAt)} />
          <DetailFieldRow label="最后修改人" value={wh.updatedBy} />
          <DetailFieldRow label="最后修改时间" value={formatDateTime(wh.updatedAt)} />
          <DetailFieldRow label="停用人" value={displayValue(wh.disabledBy)} />
          <DetailFieldRow label="停用时间" value={formatDateTime(wh.disabledAt)} />
          <DetailFieldRow label="启用人" value={displayValue(wh.enabledBy)} />
          <DetailFieldRow label="启用时间" value={formatDateTime(wh.enabledAt)} />
        </DetailSection>
      </Space>

      <EnableDisableModal
        open={statusAction !== null}
        mode={statusAction ?? 'disable'}
        entityLabel="仓库"
        maxReasonLength={200}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        enableHint="启用后仓库可再次被业务单据引用。"
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
