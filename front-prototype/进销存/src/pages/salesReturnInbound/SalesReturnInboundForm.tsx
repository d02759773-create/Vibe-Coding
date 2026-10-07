import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, DatePicker, Input, InputNumber, Row, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Toast } from '@/components/Toast'
import { SalesReturnInboundStatusTag } from '@/components/SalesReturnInboundStatusTag'
import { formatYuan, partnerLabel, todayDateString } from '@/features/salesReturnInbound/constants'
import {
  confirmSalesReturnInbound,
  createDraftFromReturn,
  getSalesReturnInboundById,
  upsertSalesReturnInbound,
} from '@/features/salesReturnInbound/storage'
import type { SalesReturnInbound, SalesReturnInboundLine } from '@/features/salesReturnInbound/types'
import { lineAmount, recalcInboundTotals, validateConfirm, validateDraftSave, confirmFailureToast } from '@/features/salesReturnInbound/validate'
import { listReturnsEligibleForOutbound } from '@/features/salesReturns/storage'
import { nowString } from '@/features/salesOrders/storage'

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

function Inner({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<SalesReturnInbound | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const eligible = useMemo(() => listReturnsEligibleForOutbound(), [doc])

  useEffect(() => {
    if (mode === 'edit' && id) {
      const existing = getSalesReturnInboundById(id)
      if (!existing || existing.status !== 'DRAFT') {
        navigate(`/sales/return-inbound/${id}`, { replace: true })
        return
      }
      setDoc(existing)
      return
    }
    const returnId = searchParams.get('returnId')
    if (returnId) {
      const created = createDraftFromReturn(returnId)
      if (created) navigate(`/sales/return-inbound/${created.id}/edit`, { replace: true })
    }
  }, [mode, id, searchParams, navigate])

  function updateLine(lineId: string, inboundQty: number) {
    if (!doc) return
    const lines = doc.lines.map((l) => {
      if (l.id !== lineId) return l
      const next = { ...l, inboundQty }
      next.lineAmount = lineAmount(next.inboundQty, next.unitPrice)
      return next
    })
    setDoc({ ...doc, lines, ...recalcInboundTotals(lines) })
  }

  function onSelectReturn(returnId: string) {
    const created = createDraftFromReturn(returnId)
    if (created) navigate(`/sales/return-inbound/${created.id}/edit`, { replace: true })
    else setToast('该退货单不可创建入库单')
  }

  function save() {
    if (!doc) return
    const err = validateDraftSave(doc)
    if (err) {
      setToast(err)
      return
    }
    upsertSalesReturnInbound({ ...doc, updatedAt: nowString(), updatedBy: '老李' })
    setToast('保存成功')
    navigate(`/sales/return-inbound/${doc.id}`)
  }

  function confirm() {
    if (!doc) return
    const err = validateConfirm(doc)
    if (err) {
      setToast(confirmFailureToast(err))
      return
    }
    upsertSalesReturnInbound({ ...doc, updatedAt: nowString(), updatedBy: '老李' })
    if (confirmSalesReturnInbound(doc.id)) {
      setToast('确认入库成功')
      navigate(`/sales/return-inbound/${doc.id}`)
    }
  }

  if (mode === 'new' && !doc) {
    return (
      <PageContainer title="新增销售退货入库单">
        <PageSection title="选择退货单">
          <Select
            style={{ width: 420 }}
            placeholder="待入库/部分入库退货单"
            options={eligible.map((r) => ({ value: r.id, label: `${r.returnNo} / ${r.outboundNo}` }))}
            onChange={onSelectReturn}
            showSearch
            optionFilterProp="label"
          />
        </PageSection>
        <Toast message={toast} onDismiss={() => setToast(null)} />
      </PageContainer>
    )
  }

  if (!doc) return <PageContainer><Typography.Text>加载中…</Typography.Text></PageContainer>

  const columns: ColumnsType<SalesReturnInboundLine> = [
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '参考未入库', dataIndex: 'refUninboundQty' },
    {
      title: '本次入库数量',
      render: (_, l) => (
        <InputNumber
          min={0}
          max={l.refUninboundQty}
          precision={0}
          value={l.inboundQty}
          onChange={(v) => updateLine(l.id, Number(v ?? 0))}
        />
      ),
    },
    { title: '入库金额', render: (_, l) => formatYuan(l.lineAmount) },
  ]

  return (
    <PageContainer
      title={`编辑 ${doc.inboundNo}`}
      tags={<SalesReturnInboundStatusTag status={doc.status} />}
      extra={<Link to={`/sales/return-inbound/${doc.id}`}>返回详情</Link>}
      data-anno="sales-return-inbound-form"
    >
      <PageSection title="基本信息" data-anno="sales-return-inbound-form-basic">
        <Row gutter={[16, 16]}>
          <Col span={8}>退货单：<Link to={`/sales/returns/${doc.returnId}`}>{doc.returnNo}</Link></Col>
          <Col span={8}>出库单：<Link to={`/sales/outbound/${doc.outboundId}`}>{doc.outboundNo}</Link></Col>
          <Col span={8}>仓库：{partnerLabel(doc.warehouseCode, doc.warehouseName)}</Col>
          <Col span={8}>
            <Typography.Text type="secondary">入库日期</Typography.Text>
            <DatePicker
              style={{ width: '100%' }}
              value={dayjs(doc.inboundDate)}
              onChange={(d) => setDoc({ ...doc, inboundDate: d?.format('YYYY-MM-DD') ?? todayDateString() })}
            />
          </Col>
          <Col span={24}>
            <Input.TextArea
              placeholder="物流信息"
              value={doc.logisticsInfo}
              onChange={(e) => setDoc({ ...doc, logisticsInfo: e.target.value })}
            />
          </Col>
        </Row>
      </PageSection>
      <PageSection title="入库明细" data-anno="sales-return-inbound-form-lines">
        <Table rowKey="id" columns={columns} dataSource={doc.lines} pagination={false} size="small" />
      </PageSection>
      <div style={formFooterStyle} data-anno="sales-return-inbound-form-actions">
        <Button type="button" onClick={save}>保存草稿</Button>
        <Button type="button" onClick={confirm}>确认入库</Button>
        <Button type="button" variant="outline" onClick={() => navigate('/sales/return-inbound')}>取消</Button>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function SalesReturnInboundNew() {
  return <Inner mode="new" />
}

export function SalesReturnInboundEdit() {
  return <Inner mode="edit" />
}
