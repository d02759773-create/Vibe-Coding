import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseOrderStatusTag } from '@/components/PurchaseOrderStatusTag'
import {
  formatYuan,
  partnerLabel,
  taxRateLabel,
} from '@/features/purchaseOrders/constants'
import {
  deletePurchaseOrder,
  getPurchaseOrderById,
  nowString,
  unreceivedQty,
  updateOrderStatus,
} from '@/features/purchaseOrders/storage'
import type { PurchaseOrder, PurchaseOrderStatus } from '@/features/purchaseOrders/types'
import { displayValue, formatDateTime } from '@/features/products/format'

type ConfirmAction = 'delete' | 'submit' | 'approve' | 'reject' | 'void' | 'close'

export function PurchaseOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const order = useMemo(() => {
    void refreshKey
    return id ? getPurchaseOrderById(id) : undefined
  }, [id, refreshKey])

  if (!order) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        采购订单不存在
        <div className="mt-4">
          <Link to="/purchase/orders" className="text-primary hover:underline">
            返回列表
          </Link>
        </div>
      </div>
    )
  }

  const showInboundCols = ['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN', 'COMPLETED'].includes(order.status)
  const showUnreceived = ['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(order.status)
  const showInboundCard = ['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN', 'COMPLETED'].includes(order.status)

  function runAction(action: ConfirmAction) {
    if (!order) return
    const current = order
    const ts = nowString()
    switch (action) {
      case 'delete':
        if (deletePurchaseOrder(current.id)) {
          setToast('采购订单已删除')
          navigate('/purchase/orders')
        }
        break
      case 'submit':
        updateOrderStatus(current.id, 'PENDING_AUDIT')
        setToast('已提交审核，等待审核确认')
        break
      case 'approve':
        updateOrderStatus(current.id, 'PENDING_STOCK_IN', {
          auditedBy: '林强',
          auditedAt: ts,
        })
        setToast('审核通过')
        break
      case 'reject':
        updateOrderStatus(current.id, 'DRAFT', { auditedBy: null, auditedAt: null })
        setToast('已驳回，单据已退回草稿')
        break
      case 'void':
        updateOrderStatus(current.id, 'VOIDED')
        setToast('采购订单已作废')
        break
      case 'close':
        updateOrderStatus(current.id, 'COMPLETED')
        setToast('订单已关闭，剩余数量不再接收')
        break
    }
    setConfirmAction(null)
    setRefreshKey((k) => k + 1)
  }

  const confirmCopy: Record<ConfirmAction, { title: string; body: string; ok: string }> = {
    delete: {
      title: '确认删除',
      body: '删除后不可恢复，该采购订单将从系统中永久移除，确认删除？',
      ok: '确认删除',
    },
    submit: {
      title: '提交审核',
      body: '提交后单据将进入待审核状态，确认提交？',
      ok: '确认提交',
    },
    approve: {
      title: '确认审核',
      body: '审核通过后关键字段将锁定，不可再修改，确认审核通过？',
      ok: '确认审核',
    },
    reject: {
      title: '确认驳回',
      body: '驳回后单据将退回草稿，采购员可重新修改，确认驳回？',
      ok: '确认驳回',
    },
    void: {
      title: '确认作废',
      body: '作废后不可恢复，单据将进入已作废状态，确认作废？',
      ok: '确认作废',
    },
    close: {
      title: '确认关闭',
      body: '关闭后剩余未入库数量将不再接收，确认关闭订单？',
      ok: '确认关闭',
    },
  }

  return (
    <div className="space-y-4 pb-8" data-anno="purchase-order-detail">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">采购管理 / 采购订单</p>
          <h2 className="text-xl font-semibold">
            采购订单 <span className="font-mono">{order.orderNo}</span>
          </h2>
          <div className="mt-2">
            <PurchaseOrderStatusTag status={order.status} />
          </div>
        </div>
        <DetailActions
          order={order}
          onAction={(a) => setConfirmAction(a)}
          onInbound={() =>
            navigate(
              `/purchase/inbound?purchaseOrderId=${order.id}&orderNo=${encodeURIComponent(order.orderNo)}`,
            )
          }
        />
      </div>

      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">基本信息</h3>
        <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
          <Field label="采购单号" value={order.orderNo} />
          <Field label="供应商" value={partnerLabel(order.supplierCode, order.supplierName)} />
          <Field label="入库仓库" value={partnerLabel(order.warehouseCode, order.warehouseName)} />
          <Field label="下单日期" value={order.orderDate} />
          <Field label="预计到货日期" value={displayValue(order.expectedArrivalDate)} />
          <Field label="采购备注" value={displayValue(order.remark)} className="md:col-span-2 lg:col-span-4" />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">商品明细</h3>
          <p className="text-sm text-muted-foreground">
            共 {order.skuCount} 种商品 | 总数量 {order.totalQuantity} 件 | 总金额{' '}
            {formatYuan(order.totalAmount)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
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
                {showInboundCols ? <th className="px-2 py-2">累计已入库数量</th> : null}
                {showUnreceived ? <th className="px-2 py-2">未入库数量</th> : null}
                <th className="px-2 py-2">行备注</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line, i) => (
                <tr key={line.id} className="border-b">
                  <td className="px-2 py-2">{i + 1}</td>
                  <td className="px-2 py-2 font-mono text-xs">{line.productCode}</td>
                  <td className="px-2 py-2">{line.productName}</td>
                  <td className="px-2 py-2">{displayValue(line.barcode)}</td>
                  <td className="px-2 py-2">{displayValue(line.specModel)}</td>
                  <td className="px-2 py-2">{displayValue(line.unit)}</td>
                  <td className="px-2 py-2">{line.quantity}</td>
                  <td className="px-2 py-2">{formatYuan(line.unitPrice)}</td>
                  <td className="px-2 py-2">{taxRateLabel(line.taxRate)}</td>
                  <td className="px-2 py-2">{formatYuan(line.lineAmount)}</td>
                  {showInboundCols ? <td className="px-2 py-2">{line.receivedQty}</td> : null}
                  {showUnreceived ? <td className="px-2 py-2">{unreceivedQty(line)}</td> : null}
                  <td className="px-2 py-2">{displayValue(line.lineRemark)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold">
          共 {order.skuCount} 种商品　合计 {order.totalQuantity} 件　{formatYuan(order.totalAmount)}
        </div>
      </section>

      {showInboundCard ? (
        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">关联入库单</h3>
          {order.inboundLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无关联入库单</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">入库单号</th>
                  <th className="py-2 pr-4">入库日期</th>
                  <th className="py-2 pr-4">本次入库数量</th>
                  <th className="py-2 pr-4">操作人</th>
                  <th className="py-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {order.inboundLinks.map((link) => (
                  <tr key={link.id} className="border-b">
                    <td className="py-2 pr-4">
                      <Link
                        to={`/purchase/inbound?inboundNo=${encodeURIComponent(link.inboundNo)}`}
                        className="text-primary hover:underline"
                      >
                        {link.inboundNo}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{link.inboundDate}</td>
                    <td className="py-2 pr-4">{link.totalQty}</td>
                    <td className="py-2 pr-4">{link.operator}</td>
                    <td className="py-2">已入库</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : (
        <section className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          审核通过后可查看关联入库单
        </section>
      )}

      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">制单信息</h3>
        <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
          <Field label="创建人" value={order.createdBy} />
          <Field label="创建时间" value={formatDateTime(order.createdAt)} />
          <Field label="最后修改人" value={displayValue(order.updatedBy)} />
          <Field label="最后修改时间" value={formatDateTime(order.updatedAt)} />
          <Field label="审核人" value={displayValue(order.auditedBy)} />
          <Field label="审核时间" value={formatDateTime(order.auditedAt)} />
        </div>
      </section>

      <Modal
        open={Boolean(confirmAction)}
        title={confirmAction ? confirmCopy[confirmAction].title : ''}
        confirmLabel={confirmAction ? confirmCopy[confirmAction].ok : '确认'}
        confirmVariant={
          confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'
        }
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && runAction(confirmAction)}
      >
        <p className="text-sm text-muted-foreground">
          {confirmAction ? confirmCopy[confirmAction].body : ''}
        </p>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

function Field({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 break-all">{value}</div>
    </div>
  )
}

function DetailActions({
  order,
  onAction,
  onInbound,
}: {
  order: PurchaseOrder
  onAction: (a: ConfirmAction) => void
  onInbound: () => void
}) {
  const s: PurchaseOrderStatus = order.status
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to="/purchase/orders"
        className="inline-flex h-7 items-center rounded-lg border px-2.5 text-sm hover:bg-muted"
      >
        返回列表
      </Link>
      {s === 'DRAFT' && (
        <>
          <Link
            to={`/purchase/orders/${order.id}/edit`}
            className="inline-flex h-7 items-center rounded-lg border px-2.5 text-sm hover:bg-muted"
          >
            编辑
          </Link>
          <Button type="button" size="sm" variant="destructive" onClick={() => onAction('delete')}>
            删除
          </Button>
          <Button type="button" size="sm" onClick={() => onAction('submit')}>
            提交审核
          </Button>
        </>
      )}
      {s === 'PENDING_AUDIT' && (
        <>
          <Button type="button" size="sm" onClick={() => onAction('approve')}>
            审核通过
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onAction('reject')}>
            驳回
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => onAction('void')}>
            作废
          </Button>
        </>
      )}
      {(s === 'PENDING_STOCK_IN' || s === 'PARTIAL_STOCK_IN') && (
        <>
          <Button type="button" size="sm" onClick={onInbound}>
            创建入库单
          </Button>
          {s === 'PENDING_STOCK_IN' ? (
            <Button type="button" size="sm" variant="destructive" onClick={() => onAction('void')}>
              作废
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => onAction('close')}>
              关闭订单
            </Button>
          )}
        </>
      )}
    </div>
  )
}
