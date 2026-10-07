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
import { SalesOutboundStatusTag } from '@/components/SalesOutboundStatusTag'
import {
  DIFF_REASON_OPTIONS,
  formatYuan,
  partnerLabel,
  todayDateString,
} from '@/features/salesOutbound/constants'
import {
  createDraftFromSalesOrder,
  getSalesOutboundById,
  listEligibleSalesOrders,
  nextOutboundId,
  nextOutboundNo,
  normalizeOutbound,
  upsertSalesOutbound,
  confirmSalesOutbound,
} from '@/features/salesOutbound/storage'
import type { SalesOutbound, SalesOutboundLine } from '@/features/salesOutbound/types'
import {
  confirmFailureToast,
  validateConfirm,
  validateDraftSave,
} from '@/features/salesOutbound/validate'
import { taxRateLabel } from '@/features/purchaseOrders/constants'
import { getSalesOrderById, nowString, unshippedQty } from '@/features/salesOrders/storage'

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

function rejectQty(line: SalesOutboundLine): number {
  return Math.max(0, line.pickedQty - line.shipQty)
}

function SalesOutboundFormInner({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<SalesOutbound | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending] = useState(false)
  const [dirty, setDirty] = useState(false)

  const eligibleOrders = useMemo(() => listEligibleSalesOrders(), [doc])

  useEffect(() => {
    if (mode === 'edit' && id) {
      const existing = getSalesOutboundById(id)
      if (!existing) {
        navigate('/sales/outbound', { replace: true })
        return
      }
      if (existing.status !== 'DRAFT') {
        navigate(`/sales/outbound/${id}`, { replace: true })
        return
      }
      setDoc(existing)
      return
    }
    if (mode === 'new') {
      const poId = searchParams.get('salesOrderId')
      if (poId) {
        const created = createDraftFromSalesOrder(poId)
        if (created) {
          navigate(`/sales/outbound/${created.id}/edit`, { replace: true })
        } else {
          setToast('该销售订单当前不可创建出库单')
        }
        return
      }
    }
    setDoc({
      id: nextOutboundId(),
      outboundNo: '',
      salesOrderId: '',
      salesOrderNo: '',
      customerId: '',
      customerCode: '',
      customerName: '',
      warehouseId: '',
      warehouseCode: '',
      warehouseName: '',
      outboundDate: todayDateString(),
      status: 'DRAFT',
      confirmBlocked: false,
      remark: '',
      lines: [],
      totalReceivedQty: 0,
      totalShipQty: 0,
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

  function patch(partial: Partial<SalesOutbound>) {
    setDoc((d) => (d ? normalizeOutbound({ ...d, ...partial }) : d))
    setDirty(true)
  }

  function patchLine(lineId: string, partial: Partial<SalesOutboundLine>) {
    setDoc((d) => {
      if (!d) return d
      const lines = d.lines.map((l) => (l.id === lineId ? { ...l, ...partial } : l))
      return normalizeOutbound({ ...d, lines })
    })
    setDirty(true)
  }

  function selectSalesOrder(poId: string) {
    const order = getSalesOrderById(poId)
    if (!order) return
    const lines: SalesOutboundLine[] = order.lines.map((l) => ({
      id: `il-${l.id}-${Date.now()}`,
      salesOrderLineId: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      refUnshippedQty: unshippedQty(l),
      pickedQty: 0,
      shipQty: 0,
      returnedQty: 0,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineAmount: 0,
      diffReason: '',
      lineRemark: '',
    }))
    patch({
      salesOrderId: order.id,
      salesOrderNo: order.orderNo,
      customerId: order.customerId,
      customerCode: order.customerCode,
      customerName: order.customerName,
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
    const outboundNo = doc.outboundNo || nextOutboundNo(doc.outboundDate || todayDateString())
    const saved = normalizeOutbound({
      ...doc,
      outboundNo,
      updatedAt: nowString(),
      updatedBy: '老李',
    })
    upsertSalesOutbound(saved)
    setDoc(saved)
    setDirty(false)
    setToast('保存成功')
    return true
  }

  function doConfirm() {
    if (!doc) return
    const latest = getSalesOutboundById(doc.id) ?? doc
    const withNo = latest.outboundNo ? latest : { ...latest, outboundNo: nextOutboundNo(latest.outboundDate) }
    const v = validateConfirm(withNo)
    if (!v.ok) {
      setToast(v.message ?? confirmFailureToast(v))
      return
    }
    upsertSalesOutbound({ ...withNo, updatedAt: nowString() })
    if (confirmSalesOutbound(withNo.id)) {
      setToast('出库确认成功')
      navigate(`/sales/outbound/${withNo.id}`)
    }
  }

  const lineColumns: ColumnsType<SalesOutboundLine> = [
    { title: '序号', width: 60, render: (_v, _r, i) => i + 1 },
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '参考未出库数量', dataIndex: 'refUnshippedQty', width: 120 },
    {
      title: '本次拣货数量',
      width: 120,
      render: (_, line) => (
        <InputNumber
          min={0}
          max={line.refUnshippedQty}
          precision={0}
          value={line.pickedQty}
          onChange={(v) => {
            const pickedQty = Number(v) || 0
            const shipQty = line.shipQty === 0 && pickedQty > 0 ? pickedQty : line.shipQty
            patchLine(line.id, { pickedQty, shipQty: Math.min(shipQty, pickedQty) })
          }}
        />
      ),
    },
    {
      title: '本次出库数量',
      width: 120,
      render: (_, line) => (
        <InputNumber
          min={0}
          max={Math.min(line.refUnshippedQty, line.pickedQty)}
          precision={0}
          value={line.shipQty}
          onChange={(v) => patchLine(line.id, { shipQty: Number(v) || 0 })}
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
            onChange={(v) => patchLine(line.id, { diffReason: (v ?? '') as SalesOutboundLine['diffReason'] })}
          />
        ) : (
          '-'
        ),
    },
    { title: '单价（含税）', render: (_, l) => formatYuan(l.unitPrice) },
    { title: '税率', render: (_, l) => taxRateLabel(l.taxRate) },
    { title: '出库金额（含税）', render: (_, l) => formatYuan(l.lineAmount) },
    {
      title: '行备注',
      render: (_, line) => (
        <Input value={line.lineRemark} onChange={(e) => patchLine(line.id, { lineRemark: e.target.value })} />
      ),
    },
  ]

  if (!doc) return null

  const title =
    mode === 'new' || !doc.outboundNo
      ? '新增销售出库单'
      : `编辑销售出库单 ${doc.outboundNo}`

  return (
    <PageContainer
      title={title}
      tags={doc.outboundNo ? <SalesOutboundStatusTag status={doc.status} /> : undefined}
      data-anno="sales-outbound-form"
    >
      <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 80 }}>
        {doc.confirmBlocked && (
          <Alert
            type="warning"
            showIcon
            message="关联销售订单已关闭，无法确认出库，请删除本草稿或联系销售员。"
          />
        )}
        <PageSection title="基本信息" data-anno="sales-outbound-form-basic">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <Typography.Text type="secondary">关联销售订单号</Typography.Text>
              {doc.salesOrderId && mode === 'edit' ? (
                <div>
                  <Link to={`/sales/orders/${doc.salesOrderId}`}>{doc.salesOrderNo}</Link>
                </div>
              ) : (
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="请选择销售订单"
                  value={doc.salesOrderId || undefined}
                  options={eligibleOrders.map((o) => ({ label: o.orderNo, value: o.id }))}
                  onChange={selectSalesOrder}
                  showSearch
                  optionFilterProp="label"
                />
              )}
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Typography.Text type="secondary">客户</Typography.Text>
              <div>{doc.customerId ? partnerLabel(doc.customerCode, doc.customerName) : '-'}</div>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Typography.Text type="secondary">出库仓库</Typography.Text>
              <div>{doc.warehouseId ? partnerLabel(doc.warehouseCode, doc.warehouseName) : '-'}</div>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Typography.Text type="secondary">出库日期</Typography.Text>
              <DatePicker
                style={{ width: '100%', marginTop: 4 }}
                value={doc.outboundDate ? dayjs(doc.outboundDate) : undefined}
                disabledDate={(d) => d.isAfter(dayjs(), 'day')}
                onChange={(d) => patch({ outboundDate: d ? d.format('YYYY-MM-DD') : '' })}
              />
            </Col>
            <Col span={24}>
              <Typography.Text type="secondary">出库备注</Typography.Text>
              <Input.TextArea
                rows={3}
                maxLength={200}
                value={doc.remark}
                onChange={(e) => patch({ remark: e.target.value })}
              />
            </Col>
          </Row>
        </PageSection>

        <PageSection title="商品明细" data-anno="sales-outbound-form-lines">
          {!doc.salesOrderId ? (
            <Typography.Text type="secondary">请先选择销售订单</Typography.Text>
          ) : (
            <>
              <Table rowKey="id" size="small" pagination={false} scroll={{ x: 1400 }} columns={lineColumns} dataSource={doc.lines} />
              <div style={totalsBarStyle}>
                拣货合计 {doc.totalReceivedQty} 件　出库合计 {doc.totalShipQty} 件　拒收合计{' '}
                {doc.totalRejectQty} 件　{formatYuan(doc.totalAmount)}
              </div>
            </>
          )}
        </PageSection>
      </Space>

      <div style={formFooterStyle} data-anno="sales-outbound-form-actions">
        <Button type="button" variant="ghost" onClick={() => (dirty ? setLeaveOpen(true) : navigate('/sales/outbound'))}>
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
            确认出库
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        title="确认出库"
        confirmLabel="确认出库"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          doConfirm()
        }}
      >
        确认后将减少库存，是否继续？
      </Modal>
      <Modal
        open={leaveOpen}
        title="离开页面"
        confirmLabel="确认离开"
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => navigate('/sales/outbound')}
      >
        当前有未保存的内容，确认离开？
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function SalesOutboundNew() {
  return <SalesOutboundFormInner mode="new" />
}

export function SalesOutboundEdit() {
  return <SalesOutboundFormInner mode="edit" />
}
