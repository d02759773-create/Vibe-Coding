import { useEffect, useMemo, useState, type CSSProperties, type HTMLAttributes } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Button as AntButton, Col, Input, Row, Select, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Modal } from '@/components/Modal'
import { ProductSelectModal } from '@/components/ProductSelectModal'
import { Toast } from '@/components/Toast'
import {
  TAX_RATE_OPTIONS,
  formatYuan,
  partnerLabel,
  todayDateString,
} from '@/features/salesOrders/constants'
import {
  getSalesOrderById,
  nextSalesOrderId,
  nextSalesOrderNo,
  nowString,
  upsertSalesOrder,
} from '@/features/salesOrders/storage'
import type { SalesOrder, SalesOrderLine, TaxRate } from '@/features/salesOrders/types'
import { displayValue } from '@/features/products/format'
import type { Product } from '@/features/products/types'
import {
  submitFailureToast,
  validateDraftSave,
  validateSubmit,
  type SalesOrderValidationResult,
} from '@/features/salesOrders/validate'
import { listCustomers } from '@/features/customers/storage'
import { listWarehouses } from '@/features/warehouses/storage'


const MAX_LINES = 50

const formFieldCol = { xs: 24, md: 12, lg: 6 }

const totalsBarStyle: CSSProperties = {
  marginTop: 12,
  padding: '12px 16px',
  borderRadius: 8,
  background: 'var(--ant-color-fill-quaternary)',
  fontWeight: 600,
}

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

type LineDraft = {
  id: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  quantity: number
  unitPrice: number
  taxRate: TaxRate
  lineRemark: string
}

function orderToDraft(order: SalesOrder): {
  customerId: string
  warehouseId: string
  orderDate: string
  expectedShipDate: string
  remark: string
  lines: LineDraft[]
} {
  return {
    customerId: order.customerId,
    warehouseId: order.warehouseId,
    orderDate: order.orderDate,
    expectedShipDate: order.expectedShipDate ?? '',
    remark: order.remark,
    lines: order.lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineRemark: l.lineRemark,
    })),
  }
}

function SalesOrderForm({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = mode === 'edit' && id ? getSalesOrderById(id) : undefined

  const [customerId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [orderDate, setOrderDate] = useState(todayDateString())
  const [expectedShipDate, setExpectedArrivalDate] = useState('')
  const [remark, setRemark] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([])
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [lineErrors, setLineErrors] = useState<Record<string, { quantity?: string; unitPrice?: string }>>({})
  const [linesAreaError, setLinesAreaError] = useState<string | null>(null)
  const [pending, setPending] = useState<'save' | 'submit' | null>(null)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const customers = useMemo(() => listCustomers().filter((c) => c.status === 'ENABLED'), [])
  const warehouses = useMemo(() => listWarehouses().filter((w) => w.status === 'ENABLED'), [])

  useEffect(() => {
    if (mode === 'edit') {
      if (!existing) return
      if (existing.status !== 'DRAFT') {
        navigate(`/sales/orders/${existing.id}`, { replace: true })
        return
      }
      const d = orderToDraft(existing)
      setSupplierId(d.customerId)
      setWarehouseId(d.warehouseId)
      setOrderDate(d.orderDate)
      setExpectedArrivalDate(d.expectedShipDate)
      setRemark(d.remark)
      setLines(d.lines.length ? d.lines : [])
    }
  }, [mode, existing, navigate])

  function markDirty() {
    setDirty(true)
  }

  function lineAmount(line: LineDraft): number {
    return Math.round(line.quantity * line.unitPrice * 100) / 100
  }

  const totals = useMemo(() => {
    const valid = lines.filter((l) => l.productId)
    return {
      skuCount: valid.length,
      totalQty: valid.reduce((s, l) => s + l.quantity, 0),
      totalAmount: valid.reduce((s, l) => s + lineAmount(l), 0),
    }
  }, [lines])

  function applyValidationResult(result: SalesOrderValidationResult, submit: boolean) {
    setFieldErrors(result.fieldErrors)
    setLineErrors(result.lineErrors)
    setLinesAreaError(result.linesAreaError ?? null)
    if (!result.ok) {
      if (submit) setToast(submitFailureToast(result))
      focusFirstValidationError(result)
    }
  }

  function focusFirstValidationError(result: SalesOrderValidationResult) {
    if (result.fieldErrors.customerId) {
      document.querySelector('[data-field="customerId"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (result.fieldErrors.warehouseId) {
      document.querySelector('[data-field="warehouseId"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (result.fieldErrors.orderDate) {
      document.querySelector('[data-field="orderDate"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (result.linesAreaError) {
      document.querySelector('[data-field="lines-area"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const firstLineId = Object.keys(result.lineErrors)[0]
    if (firstLineId) {
      document
        .querySelector(`[data-line-id="${firstLineId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function validateLineOnBlur(line: LineDraft) {
    if (!line.productId) return
    const draft = validateDraftSave({ lines: [line] })
    setLineErrors((prev) => {
      const next = { ...prev }
      if (draft.lineErrors[line.id]) next[line.id] = draft.lineErrors[line.id]
      else delete next[line.id]
      return next
    })
  }

  function buildOrder(status: SalesOrder['status'], orderNo: string, orderId: string): SalesOrder {
    const customer = customers.find((c) => c.id === customerId)
    const warehouse = warehouses.find((w) => w.id === warehouseId)
    const ts = nowString()
    const orderLines: SalesOrderLine[] = lines
      .filter((l) => l.productId)
      .map((l) => ({
        id: l.id,
        productId: l.productId,
        productCode: l.productCode,
        productName: l.productName,
        barcode: l.barcode,
        specModel: l.specModel,
        unit: l.unit,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        lineAmount: lineAmount(l),
        shippedQty: 0,
        lineRemark: l.lineRemark,
      }))

    return {
      id: orderId,
      orderNo,
      customerId: customer?.id ?? customerId,
      customerCode: customer?.customerCode ?? '',
      customerName: customer?.customerName ?? '',
      warehouseId: warehouse?.id ?? warehouseId,
      warehouseCode: warehouse?.warehouseCode ?? '',
      warehouseName: warehouse?.warehouseName ?? '',
      orderDate,
      expectedShipDate: expectedShipDate || null,
      status,
      remark,
      lines: orderLines,
      skuCount: orderLines.length,
      totalQuantity: orderLines.reduce((s, l) => s + l.quantity, 0),
      totalAmount: Math.round(orderLines.reduce((s, l) => s + l.lineAmount, 0) * 100) / 100,
      outboundLinks: existing?.outboundLinks ?? [],
      createdBy: existing?.createdBy ?? '老周',
      createdAt: existing?.createdAt ?? ts,
      updatedBy: '老周',
      updatedAt: ts,
      auditedBy: existing?.auditedBy ?? null,
      auditedAt: existing?.auditedAt ?? null,
    }
  }

  function save(submit: boolean) {
    if (pending) return
    const payload = { customerId, warehouseId, orderDate, lines }
    const result = submit ? validateSubmit(payload) : validateDraftSave(payload)
    applyValidationResult(result, submit)
    if (!result.ok) return

    setPending(submit ? 'submit' : 'save')
    try {
      const orderId = existing?.id ?? nextSalesOrderId()
      const orderNo = existing?.orderNo ?? nextSalesOrderNo(orderDate)
      const status: SalesOrder['status'] = submit ? 'PENDING_AUDIT' : 'DRAFT'
      const order = buildOrder(status, orderNo, orderId)
      upsertSalesOrder(order)
      setDirty(false)
      setFieldErrors({})
      setLineErrors({})
      setLinesAreaError(null)
      if (submit) {
        setToast('已提交审核，等待审核确认')
        navigate(`/sales/orders/${orderId}`)
      } else {
        setToast('保存成功')
        if (mode === 'new') navigate(`/sales/orders/${orderId}/edit`, { replace: true })
      }
    } finally {
      setPending(null)
    }
  }

  function addProducts(products: Product[]) {
    const remaining = MAX_LINES - lines.filter((l) => l.productId).length
    const toAdd = products.slice(0, remaining)
    if (products.length > remaining) {
      setToast('商品明细最多 50 行')
    }
    setLines((prev) => {
      const withoutEmpty = prev.filter((l) => l.productId)
      const newLines = toAdd.map((p, i) => ({
        id: `line-${Date.now()}-${i}`,
        productId: p.id,
        productCode: p.productCode,
        productName: p.productName,
        barcode: p.barcode,
        specModel: p.specModel,
        unit: p.salesUnit,
        quantity: 1,
        unitPrice: p.referencePurchasePrice ?? 0,
        taxRate: '' as TaxRate,
        lineRemark: '',
      }))
      return [...withoutEmpty, ...newLines]
    })
    markDirty()
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId))
    setLineErrors((prev) => {
      const next = { ...prev }
      delete next[lineId]
      return next
    })
    markDirty()
  }

  function updateLine(lineId: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)))
    setLineErrors((prev) => {
      if (!prev[lineId]) return prev
      const row = { ...prev[lineId] }
      if (patch.quantity !== undefined) delete row.quantity
      if (patch.unitPrice !== undefined) delete row.unitPrice
      const next = { ...prev }
      if (Object.keys(row).length === 0) delete next[lineId]
      else next[lineId] = row
      return next
    })
    markDirty()
  }

  const existingProductIds = lines.map((l) => l.productId).filter(Boolean)
  const canAddMore = lines.filter((l) => l.productId).length < MAX_LINES

  const lineColumns = useMemo((): ColumnsType<LineDraft> => {
    return [
      { title: '序号', width: 60, render: (_v, _r, index) => index + 1 },
      {
        title: '商品编码',
        dataIndex: 'productCode',
        render: (code) => <Typography.Text code>{displayValue(code)}</Typography.Text>,
      },
      { title: '商品名称', dataIndex: 'productName', render: (v) => displayValue(v) },
      { title: '商品条码', dataIndex: 'barcode', render: (v) => displayValue(v) },
      { title: '规格型号', dataIndex: 'specModel', render: (v) => displayValue(v) },
      { title: '单位', dataIndex: 'unit', render: (v) => displayValue(v) },
      {
        title: '销售数量',
        render: (_v, line) => (
          <div>
            <Input
              type="number"
              style={{ width: 96 }}
              min={1}
              value={line.quantity}
              disabled={!line.productId}
              status={lineErrors[line.id]?.quantity ? 'error' : undefined}
              onChange={(e) =>
                updateLine(line.id, { quantity: Math.max(0, parseInt(e.target.value, 10) || 0) })
              }
              onBlur={() => validateLineOnBlur(line)}
            />
            {lineErrors[line.id]?.quantity ? (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>
                {lineErrors[line.id].quantity}
              </Typography.Text>
            ) : null}
          </div>
        ),
      },
      {
        title: '单价（含税）',
        render: (_v, line) => (
          <div>
            <Input
              type="number"
              style={{ width: 112 }}
              min={0}
              step={0.01}
              prefix="¥"
              value={line.unitPrice}
              disabled={!line.productId}
              status={lineErrors[line.id]?.unitPrice ? 'error' : undefined}
              onChange={(e) =>
                updateLine(line.id, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              onBlur={() => validateLineOnBlur(line)}
            />
            {lineErrors[line.id]?.unitPrice ? (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>
                {lineErrors[line.id].unitPrice}
              </Typography.Text>
            ) : null}
          </div>
        ),
      },
      {
        title: '税率',
        render: (_v, line) => (
          <Select
            style={{ width: 96 }}
            value={line.taxRate}
            disabled={!line.productId}
            onChange={(v) => updateLine(line.id, { taxRate: v as TaxRate })}
            options={TAX_RATE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        ),
      },
      {
        title: '金额（含税）',
        align: 'right',
        render: (_v, line) => (line.productId ? formatYuan(lineAmount(line)) : '-'),
      },
      {
        title: '行备注',
        render: (_v, line) => (
          <Input
            style={{ width: 128 }}
            maxLength={100}
            disabled={!line.productId}
            value={line.lineRemark}
            onChange={(e) => updateLine(line.id, { lineRemark: e.target.value })}
          />
        ),
      },
      {
        title: '操作',
        render: (_v, line) => (
          <AntButton type="link" danger onClick={() => removeLine(line.id)}>
            删除
          </AntButton>
        ),
      },
    ]
  }, [lineErrors, lines])

  return (
    <PageContainer
      title={mode === 'new' ? '新增销售订单' : `编辑销售订单 ${existing?.orderNo ?? ''}`}
      subTitle="销售管理 / 销售订单"
      data-anno="sales-order-form"
    >
      <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 96 }}>
      <PageSection variant="form" title="基本信息" data-anno="sales-order-form-basic">
        <Row gutter={[16, 16]}>
          <Col {...formFieldCol}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text>客户</Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder="请选择客户"
                data-field="customerId"
                status={fieldErrors.customerId ? 'error' : undefined}
                value={customerId || undefined}
                onChange={(v) => {
                  setSupplierId(v ?? '')
                  setFieldErrors((prev) => {
                    if (!prev.customerId) return prev
                    const next = { ...prev }
                    delete next.customerId
                    return next
                  })
                  markDirty()
                }}
                options={customers.map((c) => ({
                  value: c.id,
                  label: partnerLabel(c.customerCode, c.customerName),
                }))}
                allowClear
              />
              {fieldErrors.customerId ? (
                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                  {fieldErrors.customerId}
                </Typography.Text>
              ) : null}
            </Space>
          </Col>
          <Col {...formFieldCol}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text>出库仓库</Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder="请选择出库仓库"
                data-field="warehouseId"
                status={fieldErrors.warehouseId ? 'error' : undefined}
                value={warehouseId || undefined}
                onChange={(v) => {
                  setWarehouseId(v ?? '')
                  setFieldErrors((prev) => {
                    if (!prev.warehouseId) return prev
                    const next = { ...prev }
                    delete next.warehouseId
                    return next
                  })
                  markDirty()
                }}
                options={warehouses.map((w) => ({
                  value: w.id,
                  label: partnerLabel(w.warehouseCode, w.warehouseName),
                }))}
                allowClear
              />
              {fieldErrors.warehouseId ? (
                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                  {fieldErrors.warehouseId}
                </Typography.Text>
              ) : null}
            </Space>
          </Col>
          <Col {...formFieldCol}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text>下单日期</Typography.Text>
              <Input
                type="date"
                data-field="orderDate"
                status={fieldErrors.orderDate ? 'error' : undefined}
                value={orderDate}
                max={todayDateString()}
                onChange={(e) => {
                  setOrderDate(e.target.value)
                  setFieldErrors((prev) => {
                    if (!prev.orderDate) return prev
                    const next = { ...prev }
                    delete next.orderDate
                    return next
                  })
                  markDirty()
                }}
              />
              {fieldErrors.orderDate ? (
                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                  {fieldErrors.orderDate}
                </Typography.Text>
              ) : null}
            </Space>
          </Col>
          <Col {...formFieldCol}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text>预计发货日期</Typography.Text>
              <Input
                type="date"
                value={expectedShipDate}
                onChange={(e) => {
                  setExpectedArrivalDate(e.target.value)
                  markDirty()
                }}
              />
            </Space>
          </Col>
          <Col span={24}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text>销售备注</Typography.Text>
              <Input.TextArea
                rows={3}
                maxLength={200}
                placeholder="请输入销售备注（选填）"
                value={remark}
                onChange={(e) => {
                  setRemark(e.target.value)
                  markDirty()
                }}
              />
            </Space>
          </Col>
        </Row>
      </PageSection>

      <PageSection variant="form" title="商品明细" data-anno="sales-order-form-lines">
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            size="sm"
            disabled={!canAddMore}
            onClick={() => setProductModalOpen(true)}
          >
            选择商品
          </Button>
        </div>
        <div data-field="lines-area">
        {linesAreaError ? (
          <Typography.Paragraph type="danger" style={{ marginBottom: 8 }}>
            {linesAreaError}
          </Typography.Paragraph>
        ) : null}
        <Table<LineDraft>
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 960 }}
          columns={lineColumns}
          dataSource={lines}
          locale={{ emptyText: '暂无商品明细，可保存空草稿或点击「选择商品」' }}
          onRow={(record) =>
            ({
              'data-line-id': record.id,
            }) as HTMLAttributes<HTMLTableRowElement>
          }
        />
        <div style={totalsBarStyle}>
          共 {totals.skuCount} 种商品　合计：{totals.totalQty} 件　{formatYuan(totals.totalAmount)}
        </div>
        </div>
      </PageSection>
      </Space>

      <div style={formFooterStyle} data-anno="sales-order-form-actions">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (dirty) setLeaveOpen(true)
            else navigate('/sales/orders')
          }}
        >
          返回列表
        </Button>
        <Button type="button" variant="outline" disabled={Boolean(pending)} onClick={() => save(false)}>
          {pending === 'save' ? '保存中…' : '保存'}
        </Button>
        <Button type="button" disabled={Boolean(pending)} onClick={() => save(true)}>
          {pending === 'submit' ? '提交中…' : '保存并提交'}
        </Button>
      </div>

      <ProductSelectModal
        open={productModalOpen}
        maxSelect={MAX_LINES - lines.filter((l) => l.productId).length}
        existingProductIds={existingProductIds}
        priceMode="wholesale"
        onClose={() => setProductModalOpen(false)}
        onConfirm={addProducts}
      />

      <Modal
        open={leaveOpen}
        title="确认离开"
        confirmLabel="确认离开"
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => navigate('/sales/orders')}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          当前有未保存的内容，确认离开？
        </Typography.Paragraph>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function SalesOrderNew() {
  return <SalesOrderForm mode="new" />
}

export function SalesOrderEdit() {
  return <SalesOrderForm mode="edit" />
}
