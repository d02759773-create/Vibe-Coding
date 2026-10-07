import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Alert, Col, DatePicker, Input, InputNumber, Row, Select, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseInboundStatusTag } from '@/components/PurchaseInboundStatusTag'
import {
  DIFF_REASON_OPTIONS,
  formatYuan,
  partnerLabel,
  todayDateString,
} from '@/features/purchaseInbound/constants'
import {
  createDraftFromPurchaseOrder,
  getPurchaseInboundById,
  listEligiblePurchaseOrders,
  nextInboundId,
  nextInboundNo,
  normalizeInbound,
  upsertPurchaseInbound,
  confirmPurchaseInbound,
} from '@/features/purchaseInbound/storage'
import type { PurchaseInbound, PurchaseInboundLine } from '@/features/purchaseInbound/types'
import {
  confirmFailureToast,
  validateConfirm,
  validateDraftSave,
} from '@/features/purchaseInbound/validate'
import { taxRateLabel } from '@/features/purchaseOrders/constants'
import { getPurchaseOrderById, nowString, unreceivedQty } from '@/features/purchaseOrders/storage'

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

const totalsBarStyle: CSSProperties = {
  marginTop: 12,
  padding: '12px 16px',
  borderRadius: 8,
  background: 'var(--ant-color-fill-quaternary)',
  fontWeight: 600,
}

function rejectQty(line: PurchaseInboundLine): number {
  return Math.max(0, line.receivedQty - line.stockInQty)
}

function PurchaseInboundFormInner({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<PurchaseInbound | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending] = useState(false)
  const [dirty, setDirty] = useState(false)

  const eligibleOrders = useMemo(() => listEligiblePurchaseOrders(), [doc])

  useEffect(() => {
    if (mode === 'edit' && id) {
      const existing = getPurchaseInboundById(id)
      if (!existing) {
        navigate('/purchase/inbound', { replace: true })
        return
      }
      if (existing.status !== 'DRAFT') {
        navigate(`/purchase/inbound/${id}`, { replace: true })
        return
      }
      setDoc(existing)
      return
    }
    if (mode === 'new') {
      const poId = searchParams.get('purchaseOrderId')
      if (poId) {
        const created = createDraftFromPurchaseOrder(poId)
        if (created) {
          navigate(`/purchase/inbound/${created.id}/edit`, { replace: true })
        } else {
          setToast('该采购订单当前不可创建入库单')
        }
        return
      }
    }
    setDoc({
      id: nextInboundId(),
      inboundNo: '',
      purchaseOrderId: '',
      purchaseOrderNo: '',
      supplierId: '',
      supplierCode: '',
      supplierName: '',
      warehouseId: '',
      warehouseCode: '',
      warehouseName: '',
      inboundDate: todayDateString(),
      status: 'DRAFT',
      confirmBlocked: false,
      remark: '',
      lines: [],
      totalReceivedQty: 0,
      totalStockInQty: 0,
      totalRejectQty: 0,
      totalAmount: 0,
      createdBy: '老李',
      createdAt: nowString(),
      updatedBy: '老李',
      updatedAt: nowString(),
      confirmedBy: null,
      confirmedAt: null,
    })
  }, [mode, id, searchParams, navigate])

  function patch(partial: Partial<PurchaseInbound>) {
    setDoc((d) => (d ? normalizeInbound({ ...d, ...partial }) : d))
    setDirty(true)
  }

  function patchLine(lineId: string, partial: Partial<PurchaseInboundLine>) {
    setDoc((d) => {
      if (!d) return d
      const lines = d.lines.map((l) => (l.id === lineId ? { ...l, ...partial } : l))
      return normalizeInbound({ ...d, lines })
    })
    setDirty(true)
  }

  function selectPurchaseOrder(poId: string) {
    const order = getPurchaseOrderById(poId)
    if (!order) return
    const lines: PurchaseInboundLine[] = order.lines.map((l) => ({
      id: `il-${l.id}-${Date.now()}`,
      purchaseOrderLineId: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      refUnreceivedQty: unreceivedQty(l),
      receivedQty: 0,
      stockInQty: 0,
      returnedQty: 0,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineAmount: 0,
      diffReason: '',
      lineRemark: '',
    }))
    patch({
      purchaseOrderId: order.id,
      purchaseOrderNo: order.orderNo,
      supplierId: order.supplierId,
      supplierCode: order.supplierCode,
      supplierName: order.supplierName,
      warehouseId: order.warehouseId,
      warehouseCode: order.warehouseCode,
      warehouseName: order.warehouseName,
      lines,
    })
  }

  function persistDraft(): boolean {
    if (!doc) return false
    const v = validateDraftSave(doc)
    if (!v.ok) {
      setToast(v.message ?? '保存失败')
      return false
    }
    const inboundNo = doc.inboundNo || nextInboundNo(doc.inboundDate || todayDateString())
    const saved = normalizeInbound({
      ...doc,
      inboundNo,
      updatedAt: nowString(),
      updatedBy: '老李',
    })
    upsertPurchaseInbound(saved)
    setDoc(saved)
    setDirty(false)
    setToast('保存成功')
    return true
  }

  function doConfirm() {
    if (!doc) return
    const latest = getPurchaseInboundById(doc.id) ?? doc
    const withNo = latest.inboundNo ? latest : { ...latest, inboundNo: nextInboundNo(latest.inboundDate) }
    const v = validateConfirm(withNo)
    if (!v.ok) {
      setToast(v.message ?? confirmFailureToast(v))
      return
    }
    upsertPurchaseInbound({ ...withNo, updatedAt: nowString() })
    if (confirmPurchaseInbound(withNo.id)) {
      setToast('入库确认成功')
      navigate(`/purchase/inbound/${withNo.id}`)
    }
  }

  const lineColumns: ColumnsType<PurchaseInboundLine> = [
    { title: '序号', width: 60, render: (_v, _r, i) => i + 1 },
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '参考未入库数量', dataIndex: 'refUnreceivedQty', width: 120 },
    {
      title: '本次实收数量',
      width: 120,
      render: (_, line) => (
        <InputNumber
          min={0}
          max={line.refUnreceivedQty}
          precision={0}
          value={line.receivedQty}
          onChange={(v) => {
            const receivedQty = Number(v) || 0
            const stockInQty = line.stockInQty === 0 && receivedQty > 0 ? receivedQty : line.stockInQty
            patchLine(line.id, { receivedQty, stockInQty: Math.min(stockInQty, receivedQty) })
          }}
        />
      ),
    },
    {
      title: '本次入库数量',
      width: 120,
      render: (_, line) => (
        <InputNumber
          min={0}
          max={Math.min(line.refUnreceivedQty, line.receivedQty)}
          precision={0}
          value={line.stockInQty}
          onChange={(v) => patchLine(line.id, { stockInQty: Number(v) || 0 })}
        />
      ),
    },
    {
      title: '破损拒收数量',
      width: 110,
      render: (_, line) => rejectQty(line),
    },
    {
      title: '差异原因',
      width: 130,
      render: (_, line) =>
        rejectQty(line) > 0 ? (
          <Select
            style={{ width: '100%' }}
            options={DIFF_REASON_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            value={line.diffReason || undefined}
            allowClear
            onChange={(v) => patchLine(line.id, { diffReason: (v ?? '') as PurchaseInboundLine['diffReason'] })}
          />
        ) : (
          '-'
        ),
    },
    { title: '单价（含税）', render: (_, l) => formatYuan(l.unitPrice) },
    { title: '税率', render: (_, l) => taxRateLabel(l.taxRate) },
    { title: '入库金额（含税）', render: (_, l) => formatYuan(l.lineAmount) },
    {
      title: '行备注',
      render: (_, line) => (
        <Input value={line.lineRemark} onChange={(e) => patchLine(line.id, { lineRemark: e.target.value })} />
      ),
    },
  ]

  if (!doc) return null

  const title =
    mode === 'new' || !doc.inboundNo
      ? '新增采购入库单'
      : `编辑采购入库单 ${doc.inboundNo}`

  return (
    <PageContainer
      title={title}
      tags={doc.inboundNo ? <PurchaseInboundStatusTag status={doc.status} /> : undefined}
      data-anno="purchase-inbound-form"
    >
      <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 80 }}>
        {doc.confirmBlocked && (
          <Alert
            type="warning"
            showIcon
            message="关联采购订单已关闭，无法确认入库，请删除本草稿或联系采购员。"
          />
        )}
        <PageSection title="基本信息">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <Typography.Text type="secondary">关联采购单号</Typography.Text>
              {doc.purchaseOrderId && mode === 'edit' ? (
                <div>
                  <Link to={`/purchase/orders/${doc.purchaseOrderId}`}>{doc.purchaseOrderNo}</Link>
                </div>
              ) : (
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="请选择采购订单"
                  value={doc.purchaseOrderId || undefined}
                  options={eligibleOrders.map((o) => ({ label: o.orderNo, value: o.id }))}
                  onChange={selectPurchaseOrder}
                  showSearch
                  optionFilterProp="label"
                />
              )}
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Typography.Text type="secondary">供应商</Typography.Text>
              <div>{doc.supplierId ? partnerLabel(doc.supplierCode, doc.supplierName) : '-'}</div>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Typography.Text type="secondary">入库仓库</Typography.Text>
              <div>{doc.warehouseId ? partnerLabel(doc.warehouseCode, doc.warehouseName) : '-'}</div>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Typography.Text type="secondary">入库日期</Typography.Text>
              <DatePicker
                style={{ width: '100%', marginTop: 4 }}
                value={doc.inboundDate ? dayjs(doc.inboundDate) : undefined}
                disabledDate={(d) => d.isAfter(dayjs(), 'day')}
                onChange={(d) => patch({ inboundDate: d ? d.format('YYYY-MM-DD') : '' })}
              />
            </Col>
            <Col span={24}>
              <Typography.Text type="secondary">入库备注</Typography.Text>
              <Input.TextArea
                rows={3}
                maxLength={200}
                value={doc.remark}
                onChange={(e) => patch({ remark: e.target.value })}
              />
            </Col>
          </Row>
        </PageSection>

        <PageSection title="商品明细">
          {!doc.purchaseOrderId ? (
            <Typography.Text type="secondary">请先选择采购订单</Typography.Text>
          ) : (
            <>
              <Table rowKey="id" size="small" pagination={false} scroll={{ x: 1400 }} columns={lineColumns} dataSource={doc.lines} />
              <div style={totalsBarStyle}>
                实收合计 {doc.totalReceivedQty} 件　入库合计 {doc.totalStockInQty} 件　拒收合计{' '}
                {doc.totalRejectQty} 件　{formatYuan(doc.totalAmount)}
              </div>
            </>
          )}
        </PageSection>
      </Space>

      <div style={formFooterStyle}>
        <Button type="button" variant="ghost" onClick={() => (dirty ? setLeaveOpen(true) : navigate('/purchase/inbound'))}>
          返回列表
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => persistDraft()}>
          保存
        </Button>
        {!doc.confirmBlocked && (
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!persistDraft()) return
              setConfirmOpen(true)
            }}
          >
            确认入库
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        title="确认入库"
        confirmLabel="确认入库"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          doConfirm()
        }}
      >
        确认后将增加库存并生成应付，是否继续？
      </Modal>
      <Modal
        open={leaveOpen}
        title="离开页面"
        confirmLabel="确认离开"
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => navigate('/purchase/inbound')}
      >
        当前有未保存的内容，确认离开？
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function PurchaseInboundNew() {
  return <PurchaseInboundFormInner mode="new" />
}

export function PurchaseInboundEdit() {
  return <PurchaseInboundFormInner mode="edit" />
}
