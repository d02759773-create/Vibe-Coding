import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, DatePicker, Input, InputNumber, Row, Select, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { ProductSelectModal } from '@/components/ProductSelectModal'
import { Toast } from '@/components/Toast'
import { OtherInboundStatusTag } from '@/components/OtherInboundStatusTag'
import { REASON_OPTIONS, partnerLabel, todayDateString } from '@/features/otherInbound/constants'
import {
  confirmOtherInbound,
  createEmptyDraft,
  getOtherInboundById,
  upsertOtherInbound,
} from '@/features/otherInbound/storage'
import type { OtherInbound, OtherInboundLine } from '@/features/otherInbound/types'
import { recalcTotals, validateConfirm, validateDraft } from '@/features/otherInbound/validate'
import { nowString } from '@/features/salesOrders/storage'
import type { Product } from '@/features/products/types'
import { listWarehouses } from '@/features/warehouses/storage'

const formFooterStyle: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  right: 0,
  zIndex: 40,
  display: 'flex',
  gap: 12,
  borderTop: '1px solid var(--ant-color-border-secondary)',
  background: 'var(--ant-color-bg-container)',
  padding: '12px 24px',
  boxShadow: 'var(--ant-box-shadow-secondary)',
}

function OtherInboundFormInner({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<OtherInbound | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [productOpen, setProductOpen] = useState(false)
  const warehouses = listWarehouses()

  useEffect(() => {
    if (mode === 'new') {
      const created = createEmptyDraft()
      navigate(`/inventory/other-inbound/${created.id}/edit`, { replace: true })
      return
    }
    if (id) {
      const d = getOtherInboundById(id)
      if (!d || d.status !== 'DRAFT') navigate(`/inventory/other-inbound/${id}`, { replace: true })
      else setDoc(d)
    }
  }, [mode, id, navigate])

  function addProducts(products: Product[]) {
    if (!doc) return
    const lines = [...doc.lines]
    for (const p of products) {
      if (lines.some((l) => l.productId === p.id)) continue
      lines.push({
        id: `oil-${p.id}-${Date.now()}`,
        productId: p.id,
        productCode: p.productCode,
        productName: p.productName,
        barcode: p.barcode,
        specModel: p.specModel,
        unit: p.salesUnit,
        qty: 0,
        lineRemark: '',
      })
    }
    setDoc({ ...doc, lines, ...recalcTotals(lines) })
    setProductOpen(false)
  }

  function updateLine(lineId: string, qty: number) {
    if (!doc) return
    const lines = doc.lines.map((l) => (l.id === lineId ? { ...l, qty } : l))
    setDoc({ ...doc, lines, ...recalcTotals(lines) })
  }

  function save(navigateAfter: boolean) {
    if (!doc) return
    const err = validateDraft(doc)
    if (err) {
      setToast(err)
      return
    }
    upsertOtherInbound({ ...doc, updatedAt: nowString() })
    if (navigateAfter) navigate(`/inventory/other-inbound/${doc.id}`)
    else setToast('已保存')
  }

  function confirm() {
    if (!doc) return
    save(false)
    const err = validateConfirm(doc)
    if (err) {
      setToast(err)
      return
    }
    if (confirmOtherInbound(doc.id)) {
      setToast('确认入库成功')
      navigate(`/inventory/other-inbound/${doc.id}`)
    }
  }

  if (!doc) return <PageContainer>加载中…</PageContainer>

  return (
    <PageContainer title={`其他入库 ${doc.inboundNo}`} tags={<OtherInboundStatusTag status={doc.status} />} data-anno="other-inbound-form">
      <div style={{ paddingBottom: 80 }}>
      <PageSection title="基本信息" data-anno="other-inbound-form-basic">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={6}>
            <Typography.Text type="secondary">入库仓库</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="请选择仓库"
              value={doc.warehouseId || undefined}
              options={warehouses.map((w) => ({ value: w.id, label: partnerLabel(w.warehouseCode, w.warehouseName) }))}
              onChange={(v) => {
                const w = warehouses.find((x) => x.id === v)
                setDoc({
                  ...doc,
                  warehouseId: v,
                  warehouseCode: w?.warehouseCode ?? '',
                  warehouseName: w?.warehouseName ?? '',
                })
              }}
            />
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Typography.Text type="secondary">入库日期</Typography.Text>
            <DatePicker
              style={{ width: '100%', marginTop: 4 }}
              value={dayjs(doc.inboundDate)}
              disabledDate={(d) => d.isAfter(dayjs(), 'day')}
              onChange={(d) => setDoc({ ...doc, inboundDate: d?.format('YYYY-MM-DD') ?? todayDateString() })}
            />
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Typography.Text type="secondary">入库原因</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              options={REASON_OPTIONS}
              value={doc.reason || undefined}
              onChange={(v) => setDoc({ ...doc, reason: v })}
            />
          </Col>
          <Col span={24}>
            <Typography.Text type="secondary">备注</Typography.Text>
            <Input.TextArea
              rows={2}
              value={doc.remark}
              onChange={(e) => setDoc({ ...doc, remark: e.target.value })}
            />
          </Col>
        </Row>
      </PageSection>
      <PageSection title="明细" data-anno="other-inbound-form-lines">
        <Button type="button" size="sm" onClick={() => setProductOpen(true)}>添加商品</Button>
        <Table
          style={{ marginTop: 12 }}
          rowKey="id"
          dataSource={doc.lines}
          pagination={false}
          columns={[
            { title: '商品编码', dataIndex: 'productCode' },
            { title: '商品名称', dataIndex: 'productName' },
            {
              title: '入库数量',
              render: (_, l: OtherInboundLine) => (
                <InputNumber min={0} precision={0} value={l.qty} onChange={(v) => updateLine(l.id, Number(v ?? 0))} />
              ),
            },
          ]}
        />
        <div style={{ marginTop: 8 }}>合计数量：{doc.totalQty}</div>
      </PageSection>
      </div>
      <div style={formFooterStyle} data-anno="other-inbound-form-actions">
        <Button type="button" variant="ghost" onClick={() => navigate('/inventory/other-inbound')}>返回列表</Button>
        <Button type="button" variant="outline" onClick={() => save(false)}>保存</Button>
        <Button type="button" onClick={confirm}>确认入库</Button>
      </div>
      <ProductSelectModal
        open={productOpen}
        maxSelect={50}
        existingProductIds={doc.lines.map((l) => l.productId)}
        onClose={() => setProductOpen(false)}
        onConfirm={addProducts}
      />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function OtherInboundNew() {
  return <OtherInboundFormInner mode="new" />
}

export function OtherInboundEdit() {
  return <OtherInboundFormInner mode="edit" />
}
