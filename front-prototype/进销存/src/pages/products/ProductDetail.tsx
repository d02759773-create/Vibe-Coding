import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Space, Typography } from 'antd'
import { Button } from '@/components/ui/button'
import { DetailFieldRow, DetailSection } from '@/components/detail/DetailSection'
import { StatusPill } from '@/components/StatusPill'
import { EnableDisableModal } from '@/components/master/EnableDisableModal'
import { Toast } from '@/components/Toast'
import { salesUnitLabel } from '@/features/products/constants'
import { displayValue, formatDateTime, formatMoney } from '@/features/products/format'
import {
  getProductById,
  listProducts,
  persistProducts,
} from '@/features/products/storage'
import type { ProductStatus } from '@/features/products/types'

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const product = useMemo(() => {
    void refreshKey
    return id ? getProductById(id) : undefined
  }, [id, refreshKey])

  if (!product) {
    return (
      <PageContainer title="商品详情">
        <Typography.Text type="secondary">未找到商品档案。</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    )
  }

  function confirmStatusChange() {
    if (!statusAction || !product) return
    const current = product
    const all = listProducts()

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
      persistProducts(
        all.map((p) =>
          p.id === current.id
            ? {
                ...p,
                status: 'DISABLED' as ProductStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : p,
        ),
      )
      setToast('商品已停用')
    } else {
      persistProducts(
        all.map((p) =>
          p.id === current.id
            ? {
                ...p,
                status: 'ENABLED' as ProductStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : p,
        ),
      )
      setToast('商品已启用')
    }

    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
    setRefreshKey((k) => k + 1)
  }

  const disableReasonDisplay =
    product.status === 'DISABLED' ? displayValue(product.disableReason) : '-'

  return (
    <PageContainer
      title="商品详情"
      subTitle={product.productCode}
      tags={<StatusPill status={product.status} />}
      extra={
        <Space wrap>
          <Button type="button" variant="outline" onClick={() => navigate('/master/products')}>
            返回列表
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/master/products/${product.id}/edit`)}
          >
            编辑
          </Button>
          {product.status === 'ENABLED' ? (
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
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <DetailSection title="基础资料">
          <DetailFieldRow label="商品编码" value={product.productCode} />
          <DetailFieldRow label="商品名称" value={product.productName} />
          <DetailFieldRow label="商品分类" value={product.category} />
          <DetailFieldRow label="规格型号" value={product.specModel} />
          <DetailFieldRow label="销售单位" value={salesUnitLabel(product.salesUnit)} />
          <DetailFieldRow label="条码" value={displayValue(product.barcode)} />
        </DetailSection>

        <DetailSection title="价格与说明">
          <DetailFieldRow label="默认零售价" value={formatMoney(product.defaultRetailPrice)} />
          <DetailFieldRow label="默认批发价" value={formatMoney(product.defaultWholesalePrice)} />
          <DetailFieldRow
            label="参考采购价"
            value={formatMoney(product.referencePurchasePrice)}
          />
          <DetailFieldRow label="商品备注" value={displayValue(product.remark)} />
        </DetailSection>

        <DetailSection title="补充信息">
          <DetailFieldRow label="停用原因" value={disableReasonDisplay} />
        </DetailSection>

        <DetailSection title="系统信息">
          <DetailFieldRow label="创建人" value={product.createdBy} />
          <DetailFieldRow label="创建时间" value={formatDateTime(product.createdAt)} />
          <DetailFieldRow label="最后修改人" value={product.updatedBy} />
          <DetailFieldRow label="最后修改时间" value={formatDateTime(product.updatedAt)} />
        </DetailSection>
      </Space>

      <EnableDisableModal
        open={statusAction !== null}
        mode={statusAction ?? 'disable'}
        entityLabel="商品"
        maxReasonLength={100}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        enableHint="启用后商品可再次被下游单据引用。"
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
