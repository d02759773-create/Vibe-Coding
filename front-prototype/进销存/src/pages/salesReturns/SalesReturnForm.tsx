import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Alert, Col, DatePicker, Input, InputNumber, Row, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Toast } from '@/components/Toast'
import { SalesReturnStatusTag } from '@/components/SalesReturnStatusTag'
import { formatYuan, partnerLabel, todayDateString } from '@/features/salesReturns/constants'
import {
  createDraftFromOutbound,
  getSalesReturnById,
  listEligibleOutboundsForReturn,
  maxReturnableQty,
  normalizeReturn,
  resolveOutboundIdFromQuery,
  upsertSalesReturn,
  submitSalesReturn,
} from '@/features/salesReturns/storage'
import type { SalesReturn, SalesReturnLine } from '@/features/salesReturns/types'
import { lineAmount, recalcReturnTotals, validateDraftSave, validateSubmit, submitFailureToast } from '@/features/salesReturns/validate'
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

function SalesReturnFormInner({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<SalesReturn | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const eligibleInbounds = useMemo(() => listEligibleOutboundsForReturn(), [])

  useEffect(() => {
    if (mode === 'edit' && id) {
      const existing = getSalesReturnById(id)
      if (!existing || existing.status !== 'DRAFT') {
        navigate(`/sales/returns/${id ?? ''}`, { replace: true })
        return
      }
      setDoc(existing)
      return
    }
    const outboundId = resolveOutboundIdFromQuery(searchParams.get('outboundNo'), searchParams.get('outboundId'))
    if (outboundId) {
      const created = createDraftFromOutbound(outboundId)
      if (created) {
        navigate(`/sales/returns/${created.id}/edit`, { replace: true })
      }
    }
  }, [mode, id, searchParams, navigate])

  function maxFor(lineId: string) {
    if (!doc) return 0
    return maxReturnableQty(doc.outboundId, lineId, doc.id)
  }

  function updateLine(lineId: string, patch: Partial<SalesReturnLine>) {
    if (!doc) return
    const lines = doc.lines.map((l) => {
      if (l.id !== lineId) return l
      const next = { ...l, ...patch }
      next.lineAmount = lineAmount(next.returnQty, next.unitPrice)
      next.refReturnableQty = maxFor(l.outboundLineId)
      return next
    })
    setDoc({ ...doc, lines, ...recalcReturnTotals(lines) })
  }

  function onSelectInbound(outboundId: string) {
    const created = createDraftFromOutbound(outboundId)
    if (created) navigate(`/sales/returns/${created.id}/edit`, { replace: true })
    else setToast('该出库单不可退货或无可退数量')
  }

  function saveDraft() {
    if (!doc) return
    const err = validateDraftSave(doc, (lid) => maxReturnableQty(doc.outboundId, lid, doc.id))
    if (err) {
      setToast(err)
      return
    }
    const ts = nowString()
    upsertSalesReturn(
      normalizeReturn({
        ...doc,
        updatedBy: '老李',
        updatedAt: ts,
      }),
    )
    setToast('保存成功')
    navigate(`/sales/returns/${doc.id}`)
  }

  function doSubmit() {
    if (!doc) return
    const err = validateSubmit(doc, (lid) => maxReturnableQty(doc.outboundId, lid, doc.id))
    if (err) {
      setToast(submitFailureToast(err))
      return
    }
    upsertSalesReturn(normalizeReturn({ ...doc, updatedAt: nowString() }))
    if (submitSalesReturn(doc.id)) {
      setToast('已提交审核')
      navigate(`/sales/returns/${doc.id}`)
    }
  }

  if (mode === 'new' && !doc) {
    return (
      <PageContainer title="新增销售退货单">
        <PageSection title="选择出库单">
          {eligibleInbounds.length === 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="暂无可退货的已出库单"
              description={
                <>
                  请先在
                  <Link to="/sales/outbound">销售出库</Link>
                  中确认出库，且行上仍有可退数量。也可在已出库单详情点击「发起退货」。
                </>
              }
            />
          )}
          <Select
            style={{ width: 420 }}
            placeholder="选择已出库单"
            options={eligibleInbounds.map((d) => ({
              value: d.id,
              label: `${d.outboundNo} / ${partnerLabel(d.customerCode, d.customerName)}`,
            }))}
            onChange={onSelectInbound}
            showSearch
            optionFilterProp="label"
            notFoundContent={eligibleInbounds.length === 0 ? '暂无已出库单' : '无匹配结果'}
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

  const columns: ColumnsType<SalesReturnLine> = [
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '参考可退数量', dataIndex: 'refReturnableQty' },
    {
      title: '本次退货数量',
      render: (_, l) => (
        <InputNumber
          min={0}
          max={maxFor(l.outboundLineId)}
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
      title={mode === 'new' ? '新增销售退货单' : `编辑 ${doc.returnNo}`}
      tags={<SalesReturnStatusTag status={doc.status} />}
      data-anno="sales-return-form"
      extra={<Link to={`/sales/returns/${doc.id}`}>返回详情</Link>}
    >
      <PageSection title="基本信息" data-anno="sales-return-form-basic">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Typography.Text type="secondary">关联出库单</Typography.Text>
            <div>
              <Link to={`/sales/outbound/${doc.outboundId}`}>{doc.outboundNo}</Link>
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
      <PageSection title="退货明细" data-anno="sales-return-form-lines">
        <Table rowKey="id" columns={columns} dataSource={doc.lines} pagination={false} size="small" />
        <div style={{ marginTop: 12 }}>
          退货总数量 {doc.totalReturnQty}，总金额 {formatYuan(doc.totalAmount)}
        </div>
      </PageSection>
      <div style={formFooterStyle} data-anno="sales-return-form-actions">
        <Button type="button" onClick={saveDraft}>保存草稿</Button>
        <Button type="button" onClick={doSubmit}>提交审核</Button>
        <Button type="button" variant="outline" onClick={() => navigate('/sales/returns')}>取消</Button>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function SalesReturnNew() {
  return <SalesReturnFormInner mode="new" />
}

export function SalesReturnEdit() {
  return <SalesReturnFormInner mode="edit" />
}
