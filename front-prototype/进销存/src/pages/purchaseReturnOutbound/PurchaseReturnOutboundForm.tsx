import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, DatePicker, Input, InputNumber, Row, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Toast } from '@/components/Toast'
import { PurchaseReturnOutboundStatusTag } from '@/components/PurchaseReturnOutboundStatusTag'
import { formatYuan, partnerLabel, todayDateString } from '@/features/purchaseReturnOutbound/constants'
import {
  confirmPurchaseReturnOutbound,
  createDraftFromReturn,
  getPurchaseReturnOutboundById,
  upsertPurchaseReturnOutbound,
} from '@/features/purchaseReturnOutbound/storage'
import type { PurchaseReturnOutbound, PurchaseReturnOutboundLine } from '@/features/purchaseReturnOutbound/types'
import { lineAmount, recalcOutboundTotals, validateConfirm, validateDraftSave, confirmFailureToast } from '@/features/purchaseReturnOutbound/validate'
import { listReturnsEligibleForOutbound } from '@/features/purchaseReturns/storage'
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

function Inner({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<PurchaseReturnOutbound | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const eligible = useMemo(() => listReturnsEligibleForOutbound(), [doc])

  useEffect(() => {
    if (mode === 'edit' && id) {
      const existing = getPurchaseReturnOutboundById(id)
      if (!existing || existing.status !== 'DRAFT') {
        navigate(`/purchase/return-outbound/${id}`, { replace: true })
        return
      }
      setDoc(existing)
      return
    }
    const returnId = searchParams.get('returnId')
    if (returnId) {
      const created = createDraftFromReturn(returnId)
      if (created) navigate(`/purchase/return-outbound/${created.id}/edit`, { replace: true })
    }
  }, [mode, id, searchParams, navigate])

  function updateLine(lineId: string, outboundQty: number) {
    if (!doc) return
    const lines = doc.lines.map((l) => {
      if (l.id !== lineId) return l
      const next = { ...l, outboundQty }
      next.lineAmount = lineAmount(next.outboundQty, next.unitPrice)
      return next
    })
    setDoc({ ...doc, lines, ...recalcOutboundTotals(lines) })
  }

  function onSelectReturn(returnId: string) {
    const created = createDraftFromReturn(returnId)
    if (created) navigate(`/purchase/return-outbound/${created.id}/edit`, { replace: true })
    else setToast('该退货单不可创建出库单')
  }

  function save() {
    if (!doc) return
    const err = validateDraftSave(doc)
    if (err) {
      setToast(err)
      return
    }
    upsertPurchaseReturnOutbound({ ...doc, updatedAt: nowString(), updatedBy: '老李' })
    setToast('保存成功')
    navigate(`/purchase/return-outbound/${doc.id}`)
  }

  function confirm() {
    if (!doc) return
    const err = validateConfirm(doc)
    if (err) {
      setToast(confirmFailureToast(err))
      return
    }
    upsertPurchaseReturnOutbound({ ...doc, updatedAt: nowString(), updatedBy: '老李' })
    if (confirmPurchaseReturnOutbound(doc.id)) {
      setToast('确认出库成功')
      navigate(`/purchase/return-outbound/${doc.id}`)
    }
  }

  if (mode === 'new' && !doc) {
    return (
      <PageContainer title="新增退货出库单">
        <PageSection title="选择退货单">
          <Select
            style={{ width: 420 }}
            placeholder="待出库/部分出库退货单"
            options={eligible.map((r) => ({ value: r.id, label: `${r.returnNo} / ${r.inboundNo}` }))}
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

  const columns: ColumnsType<PurchaseReturnOutboundLine> = [
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '参考未出库', dataIndex: 'refUnoutboundQty' },
    {
      title: '本次出库数量',
      render: (_, l) => (
        <InputNumber
          min={0}
          max={l.refUnoutboundQty}
          precision={0}
          value={l.outboundQty}
          onChange={(v) => updateLine(l.id, Number(v ?? 0))}
        />
      ),
    },
    { title: '出库金额', render: (_, l) => formatYuan(l.lineAmount) },
  ]

  return (
    <PageContainer
      title={`编辑 ${doc.outboundNo}`}
      tags={<PurchaseReturnOutboundStatusTag status={doc.status} />}
      extra={<Link to={`/purchase/return-outbound/${doc.id}`}>返回详情</Link>}
    >
      <PageSection title="基本信息">
        <Row gutter={[16, 16]}>
          <Col span={8}>退货单：<Link to={`/purchase/returns/${doc.returnId}`}>{doc.returnNo}</Link></Col>
          <Col span={8}>入库单：<Link to={`/purchase/inbound/${doc.inboundId}`}>{doc.inboundNo}</Link></Col>
          <Col span={8}>仓库：{partnerLabel(doc.warehouseCode, doc.warehouseName)}</Col>
          <Col span={8}>
            <Typography.Text type="secondary">出库日期</Typography.Text>
            <DatePicker
              style={{ width: '100%' }}
              value={dayjs(doc.outboundDate)}
              onChange={(d) => setDoc({ ...doc, outboundDate: d?.format('YYYY-MM-DD') ?? todayDateString() })}
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
      <PageSection title="出库明细">
        <Table rowKey="id" columns={columns} dataSource={doc.lines} pagination={false} size="small" />
      </PageSection>
      <div style={formFooterStyle}>
        <Button type="button" onClick={save}>保存草稿</Button>
        <Button type="button" onClick={confirm}>确认出库</Button>
        <Button type="button" variant="outline" onClick={() => navigate('/purchase/return-outbound')}>取消</Button>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

export function PurchaseReturnOutboundNew() {
  return <Inner mode="new" />
}

export function PurchaseReturnOutboundEdit() {
  return <Inner mode="edit" />
}
