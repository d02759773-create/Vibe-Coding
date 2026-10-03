import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import { ProductSelectModal } from '@/components/ProductSelectModal'
import { Toast } from '@/components/Toast'
import {
  TAX_RATE_OPTIONS,
  formatYuan,
  partnerLabel,
  todayDateString,
} from '@/features/purchaseOrders/constants'
import {
  getPurchaseOrderById,
  nextPurchaseOrderId,
  nextPurchaseOrderNo,
  nowString,
  upsertPurchaseOrder,
} from '@/features/purchaseOrders/storage'
import type { PurchaseOrder, PurchaseOrderLine, TaxRate } from '@/features/purchaseOrders/types'
import { displayValue } from '@/features/products/format'
import type { Product } from '@/features/products/types'
import { listSuppliers } from '@/features/suppliers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

const inputClass =
  'h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const MAX_LINES = 50

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

function emptyLine(id: string): LineDraft {
  return {
    id,
    productId: '',
    productCode: '',
    productName: '',
    barcode: null,
    specModel: '',
    unit: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: '',
    lineRemark: '',
  }
}

function orderToDraft(order: PurchaseOrder): {
  supplierId: string
  warehouseId: string
  orderDate: string
  expectedArrivalDate: string
  remark: string
  lines: LineDraft[]
} {
  return {
    supplierId: order.supplierId,
    warehouseId: order.warehouseId,
    orderDate: order.orderDate,
    expectedArrivalDate: order.expectedArrivalDate ?? '',
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

function PurchaseOrderForm({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = mode === 'edit' && id ? getPurchaseOrderById(id) : undefined

  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [orderDate, setOrderDate] = useState(todayDateString())
  const [expectedArrivalDate, setExpectedArrivalDate] = useState('')
  const [remark, setRemark] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([emptyLine('new-1')])
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const suppliers = useMemo(() => listSuppliers().filter((s) => s.status === 'ENABLED'), [])
  const warehouses = useMemo(() => listWarehouses().filter((w) => w.status === 'ENABLED'), [])

  useEffect(() => {
    if (mode === 'edit') {
      if (!existing) return
      if (existing.status !== 'DRAFT') {
        navigate(`/purchase/orders/${existing.id}`, { replace: true })
        return
      }
      const d = orderToDraft(existing)
      setSupplierId(d.supplierId)
      setWarehouseId(d.warehouseId)
      setOrderDate(d.orderDate)
      setExpectedArrivalDate(d.expectedArrivalDate)
      setRemark(d.remark)
      setLines(d.lines.length ? d.lines : [emptyLine('new-1')])
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

  function validate(strict: boolean): boolean {
    const errors: Record<string, string> = {}
    if (strict) {
      if (!supplierId) errors.supplierId = '请选择供应商'
      if (!warehouseId) errors.warehouseId = '请选择入库仓库'
    }
    if (orderDate > todayDateString()) errors.orderDate = '下单日期不能晚于今天'
    const validLines = lines.filter((l) => l.productId)
    if (strict && validLines.length === 0) {
      setToast('商品明细不可为空，请至少添加一行商品')
      setFieldErrors(errors)
      return false
    }
    if (strict) {
      for (const line of validLines) {
        if (line.quantity <= 0) {
          setToast('采购数量不可为 0')
          setFieldErrors(errors)
          return false
        }
        if (line.unitPrice < 0) {
          setToast('请填写单价')
          setFieldErrors(errors)
          return false
        }
      }
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function buildOrder(status: PurchaseOrder['status'], orderNo: string, orderId: string): PurchaseOrder {
    const supplier = suppliers.find((s) => s.id === supplierId)
    const warehouse = warehouses.find((w) => w.id === warehouseId)
    const ts = nowString()
    const orderLines: PurchaseOrderLine[] = lines
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
        receivedQty: 0,
        lineRemark: l.lineRemark,
      }))

    return {
      id: orderId,
      orderNo,
      supplierId: supplier?.id ?? supplierId,
      supplierCode: supplier?.supplierCode ?? '',
      supplierName: supplier?.supplierName ?? '',
      warehouseId: warehouse?.id ?? warehouseId,
      warehouseCode: warehouse?.warehouseCode ?? '',
      warehouseName: warehouse?.warehouseName ?? '',
      orderDate,
      expectedArrivalDate: expectedArrivalDate || null,
      status,
      remark,
      lines: orderLines,
      skuCount: orderLines.length,
      totalQuantity: orderLines.reduce((s, l) => s + l.quantity, 0),
      totalAmount: Math.round(orderLines.reduce((s, l) => s + l.lineAmount, 0) * 100) / 100,
      inboundLinks: existing?.inboundLinks ?? [],
      createdBy: existing?.createdBy ?? '老周',
      createdAt: existing?.createdAt ?? ts,
      updatedBy: '老周',
      updatedAt: ts,
      auditedBy: existing?.auditedBy ?? null,
      auditedAt: existing?.auditedAt ?? null,
    }
  }

  function save(submit: boolean) {
    if (submit && !validate(true)) return
    if (!submit && !validate(false)) return
    if (submit) {
      const supplier = suppliers.find((s) => s.id === supplierId)
      const warehouse = warehouses.find((w) => w.id === warehouseId)
      if (!supplier || !warehouse) {
        validate(true)
        return
      }
    }

    const orderId = existing?.id ?? nextPurchaseOrderId()
    const orderNo = existing?.orderNo ?? nextPurchaseOrderNo(orderDate)
    const status: PurchaseOrder['status'] = submit ? 'PENDING_AUDIT' : 'DRAFT'
    const order = buildOrder(status, orderNo, orderId)
    upsertPurchaseOrder(order)
    setDirty(false)
    if (submit) {
      setToast('已提交审核，等待审核确认')
      navigate(`/purchase/orders/${orderId}`)
    } else {
      setToast('保存成功')
      if (mode === 'new') navigate(`/purchase/orders/${orderId}/edit`, { replace: true })
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
    const withProduct = lines.filter((l) => l.productId)
    if (withProduct.length <= 1 && lines.find((l) => l.id === lineId)?.productId) {
      setToast('至少保留一行商品明细')
      return
    }
    setLines((prev) => {
      const next = prev.filter((l) => l.id !== lineId)
      return next.length ? next : [emptyLine(`empty-${Date.now()}`)]
    })
    markDirty()
  }

  function updateLine(lineId: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)))
    markDirty()
  }

  const existingProductIds = lines.map((l) => l.productId).filter(Boolean)
  const canAddMore = lines.filter((l) => l.productId).length < MAX_LINES

  return (
    <div className="pb-24" data-anno="purchase-order-form">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">采购管理 / 采购订单</p>
        <h2 className="text-xl font-semibold">
          {mode === 'new' ? '新增采购订单' : `编辑采购订单 ${existing?.orderNo ?? ''}`}
        </h2>
      </div>

      <section className="mb-4 rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">基本信息</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm">
            <span>
              供应商 <span className="text-destructive">*</span>
            </span>
            <select
              className={inputClass}
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value)
                markDirty()
              }}
            >
              <option value="">请选择供应商</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {partnerLabel(s.supplierCode, s.supplierName)}
                </option>
              ))}
            </select>
            {fieldErrors.supplierId ? (
              <span className="text-xs text-destructive">{fieldErrors.supplierId}</span>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm">
            <span>
              入库仓库 <span className="text-destructive">*</span>
            </span>
            <select
              className={inputClass}
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value)
                markDirty()
              }}
            >
              <option value="">请选择入库仓库</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {partnerLabel(w.warehouseCode, w.warehouseName)}
                </option>
              ))}
            </select>
            {fieldErrors.warehouseId ? (
              <span className="text-xs text-destructive">{fieldErrors.warehouseId}</span>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm">
            <span>下单日期</span>
            <input
              type="date"
              className={inputClass}
              value={orderDate}
              max={todayDateString()}
              onChange={(e) => {
                setOrderDate(e.target.value)
                markDirty()
              }}
            />
            {fieldErrors.orderDate ? (
              <span className="text-xs text-destructive">{fieldErrors.orderDate}</span>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm">
            <span>预计到货日期</span>
            <input
              type="date"
              className={inputClass}
              value={expectedArrivalDate}
              onChange={(e) => {
                setExpectedArrivalDate(e.target.value)
                markDirty()
              }}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2 lg:col-span-4">
            <span>采购备注</span>
            <textarea
              className="min-h-20 rounded-lg border bg-background px-3 py-2 text-sm"
              maxLength={200}
              placeholder="请输入采购备注（选填）"
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value)
                markDirty()
              }}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">商品明细</h3>
          <Button
            type="button"
            size="sm"
            disabled={!canAddMore}
            onClick={() => setProductModalOpen(true)}
          >
            选择商品
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-2 py-2">序号</th>
                <th className="px-2 py-2">商品编码</th>
                <th className="px-2 py-2">商品名称</th>
                <th className="px-2 py-2">商品条码</th>
                <th className="px-2 py-2">规格型号</th>
                <th className="px-2 py-2">单位</th>
                <th className="px-2 py-2">采购数量</th>
                <th className="px-2 py-2">单价（含税）</th>
                <th className="px-2 py-2">税率</th>
                <th className="px-2 py-2">金额（含税）</th>
                <th className="px-2 py-2">行备注</th>
                <th className="px-2 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id} className="border-b">
                  <td className="px-2 py-2">{index + 1}</td>
                  <td className="px-2 py-2 font-mono text-xs">{displayValue(line.productCode)}</td>
                  <td className="px-2 py-2">{displayValue(line.productName)}</td>
                  <td className="px-2 py-2">{displayValue(line.barcode)}</td>
                  <td className="px-2 py-2">{displayValue(line.specModel)}</td>
                  <td className="px-2 py-2">{displayValue(line.unit)}</td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={1}
                      className="h-8 w-24 rounded border px-2 text-sm"
                      value={line.quantity}
                      disabled={!line.productId}
                      onChange={(e) =>
                        updateLine(line.id, { quantity: Math.max(0, parseInt(e.target.value, 10) || 0) })
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">¥</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8 w-28 rounded border px-2 text-sm"
                        value={line.unitPrice}
                        disabled={!line.productId}
                        onChange={(e) =>
                          updateLine(line.id, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })
                        }
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="h-8 rounded border px-2 text-sm"
                      value={line.taxRate}
                      disabled={!line.productId}
                      onChange={(e) => updateLine(line.id, { taxRate: e.target.value as TaxRate })}
                    >
                      {TAX_RATE_OPTIONS.map((o) => (
                        <option key={o.label} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 text-right">
                    {line.productId ? formatYuan(lineAmount(line)) : '-'}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className="h-8 w-32 rounded border px-2 text-sm"
                      maxLength={100}
                      disabled={!line.productId}
                      value={line.lineRemark}
                      onChange={(e) => updateLine(line.id, { lineRemark: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="text-destructive hover:underline"
                      onClick={() => removeLine(line.id)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold">
          共 {totals.skuCount} 种商品　合计：{totals.totalQty} 件　{formatYuan(totals.totalAmount)}
        </div>
      </section>

      <div className="fixed bottom-0 right-0 z-40 flex gap-3 border-t bg-background/95 px-6 py-3 shadow-lg">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (dirty) setLeaveOpen(true)
            else navigate('/purchase/orders')
          }}
        >
          返回列表
        </Button>
        <Button type="button" variant="outline" onClick={() => save(false)}>
          保存
        </Button>
        <Button type="button" onClick={() => save(true)}>
          保存并提交
        </Button>
      </div>

      <ProductSelectModal
        open={productModalOpen}
        maxSelect={MAX_LINES - lines.filter((l) => l.productId).length}
        existingProductIds={existingProductIds}
        onClose={() => setProductModalOpen(false)}
        onConfirm={addProducts}
      />

      <Modal
        open={leaveOpen}
        title="确认离开"
        confirmLabel="确认离开"
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => navigate('/purchase/orders')}
      >
        <p className="text-sm text-muted-foreground">当前有未保存的内容，确认离开？</p>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export function PurchaseOrderNew() {
  return <PurchaseOrderForm mode="new" />
}

export function PurchaseOrderEdit() {
  return <PurchaseOrderForm mode="edit" />
}
