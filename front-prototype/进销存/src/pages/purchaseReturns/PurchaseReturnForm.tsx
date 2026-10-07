import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Alert, Col, DatePicker, Input, InputNumber, Row, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Toast } from '@/components/Toast'
import { PurchaseReturnStatusTag } from '@/components/PurchaseReturnStatusTag'
import { formatYuan, partnerLabel, todayDateString } from '@/features/purchaseReturns/constants'
import {
  createDraftFromInbound,
  getPurchaseReturnById,
  listEligibleInboundsForReturn,
  maxReturnableQty,
  normalizeReturn,
  resolveInboundIdFromQuery,
  upsertPurchaseReturn,
  submitPurchaseReturn,
} from '@/features/purchaseReturns/storage'
import type { PurchaseReturn, PurchaseReturnLine } from '@/features/purchaseReturns/types'
import { lineAmount, recalcReturnTotals, validateDraftSave, validateSubmit, submitFailureToast } from '@/features/purchaseReturns/validate'
import { taxRateLabel } from '@/features/purchaseOrders/constants'
import { nowString } from '@/features/purchaseOrders/storage'

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
}

function PurchaseReturnFormInner({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<PurchaseReturn | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const eligibleInbounds = useMemo(() => listEligibleInboundsForReturn(), [])

  useEffect(() => {
    if (mode === 'edit' && id) {
      const existing = getPurchaseReturnById(id)
      if (!existing || existing.status !== 'DRAFT') {
        navigate(`/purchase/returns/${id ?? ''}`, { replace: true })
        return
      }
      setDoc(existing)
      return
    }
    const inboundId = resolveInboundIdFromQuery(searchParams.get('inboundNo'), searchParams.get('inboundId'))
    if (inboundId) {
      const created = createDraftFromInbound(inboundId)
      if (created) {
        navigate(`/purchase/returns/${created.id}/edit`, { replace: true })
      }
    }
  }, [mode, id, searchParams, navigate])

  function maxFor(lineId: string) {
    if (!doc) return 0
    return maxReturnableQty(doc.inboundId, lineId, doc.id)
  }

  function updateLine(lineId: string, patch: Partial<PurchaseReturnLine>) {
    if (!doc) return
    const lines = doc.lines.map((l) => {
      if (l.id !== lineId) return l
      const next = { ...l, ...patch }
      next.lineAmount = lineAmount(next.returnQty, next.unitPrice)
      next.refReturnableQty = maxFor(l.inboundLineId)
      return next
    })
    setDoc({ ...doc, lines, ...recalcReturnTotals(lines) })
  }

  function onSelectInbound(inboundId: string) {
    const created = createDraftFromInbound(inboundId)
    if (created) navigate(`/purchase/returns/${created.id}/edit`, { replace: true })
    else setToast('该入库单不可退货或无可退数量')
  }

  function saveDraft() {
    if (!doc) return
    const err = validateDraftSave(doc, (lid) => maxReturnableQty(doc.inboundId, lid, doc.id))
    if (err) {
      setToast(err)
      return
    }
    const ts = nowString()
    upsertPurchaseReturn(
      normalizeReturn({
        ...doc,
        updatedBy: '老李',
        updatedAt: ts,
      }),
    )
    setToast('保存成功')
    navigate(`/purchase/returns/${doc.id}`)
  }

  function doSubmit() {
    if (!doc) return
    const err = validateSubmit(doc, (lid) => maxReturnableQty(doc.inboundId, lid, doc.id))
    if (err) {
      setToast(submitFailureToast(err))
      return
    }
    upsertPurchaseReturn(normalizeReturn({ ...doc, updatedAt: nowString() }))
    if (submitPurchaseReturn(doc.id)) {
      setToast('已提交审核')
      navigate(`/purchase/returns/${doc.id}`)
    }
  }

  if (mode === 'new' && !doc) {
    return (
      <PageContainer title="新增采购退货单">
        <PageSection title="选择入库单">
          {eligibleInbounds.length === 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="暂无可退货的已入库单"
              description={
                <>
                  请先在
                  <Link to="/purchase/inbound">采购入库</Link>
                  中确认入库，且行上仍有可退数量。也可在已入库单详情点击「发起退货」。
                </>
              }
            />
          )}
          <Select
            style={{ width: 420 }}
            placeholder="选择已入库单"
            options={eligibleInbounds.map((d) => ({
              value: d.id,
              label: `${d.inboundNo} / ${partnerLabel(d.supplierCode, d.supplierName)}`,
            }))}
            onChange={onSelectInbound}
            showSearch
            optionFilterProp="label"
            notFoundContent={eligibleInbounds.length === 0 ? '暂无已入库单' : '无匹配结果'}
          />
        </PageSection>
        <Toast message={toast} onDismiss={() => setToast(null)} />
      </PageContainer>
    )
  }

  if (!doc) {
    return (
      <PageContainer>
        <Typography.Text>加载中…</Typography.Text>
      </PageContainer>
    )
  }

  const columns: ColumnsType<PurchaseReturnLine> = [
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '参考可退数量', dataIndex: 'refReturnableQty' },
    {
      title: '本次退货数量',
      render: (_, l) => (
        <InputNumber
          min={0}
          max={maxFor(l.inboundLineId)}
          precision={0}
          value={l.returnQty}
          onChange={(v) => updateLine(l.id, { returnQty: Number(v ?? 0) })}
        />
      ),
    },
    { title: '单价（含税）', render: (_, l) => formatYuan(l.unitPrice) },
    { title: '税率', render: (_, l) => taxRateLabel(l.taxRate) },
    { title: '退货金额', render: (_, l) => formatYuan(l.lineAmount) },
    {
      title: '行备注',
      render: (_, l) => (
        <Input value={l.lineRemark} onChange={(e) => updateLine(l.id, { lineRemark: e.target.value })} />
      ),
    },
  ]

  return (
    <PageContainer
      title={mode === 'new' ? '新增采购退货单' : `编辑 ${doc.returnNo}`}
      tags={<PurchaseReturnStatusTag status={doc.status} />}
      extra={<Link to={`/purchase/returns/${doc.id}`}>返回详情</Link>}
    >
      <PageSection title="基本信息">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Typography.Text type="secondary">关联入库单</Typography.Text>
            <div>
              <Link to={`/purchase/inbound/${doc.inboundId}`}>{doc.inboundNo}</Link>
            </div>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">退货日期</Typography.Text>
            <DatePicker
              style={{ width: '100%' }}
              value={dayjs(doc.returnDate)}
              onChange={(d) => setDoc({ ...doc, returnDate: d?.format('YYYY-MM-DD') ?? todayDateString() })}
            />
          </Col>
          <Col span={24}>
            <Typography.Text type="secondary">退货原因</Typography.Text>
            <Input.TextArea
              rows={2}
              maxLength={200}
              value={doc.returnReason}
              onChange={(e) => setDoc({ ...doc, returnReason: e.target.value })}
            />
          </Col>
        </Row>
      </PageSection>
      <PageSection title="退货明细">
        <Table rowKey="id" columns={columns} dataSource={doc.lines} pagination={false} size="small" />
        <div style={{ marginTop: 12 }}>
          退货总数量 {doc.totalReturnQty}，总金额 {formatYuan(doc.totalAmount)}
        </div>
      </PageSection>
      <div style={formFooterStyle}>
        <Button type="button" onClick={saveDraft}>保存草稿</Button>
        <Button type="button" onClick={doSubmit}>提交审核</Button>
        <Button type="button" variant="outline" onClick={() => navigate('/purchase/returns')}>取消</Button>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function PurchaseReturnNew() {
  return <PurchaseReturnFormInner mode="new" />
}

export function PurchaseReturnEdit() {
  return <PurchaseReturnFormInner mode="edit" />
}
