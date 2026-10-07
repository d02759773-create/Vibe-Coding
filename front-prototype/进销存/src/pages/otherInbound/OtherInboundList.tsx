import { useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Space, Tabs, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { OtherInboundStatusTag } from '@/components/OtherInboundStatusTag'
import { OTHER_INBOUND_TABS, partnerLabel, tabCountLabel } from '@/features/otherInbound/constants'
import {
  confirmOtherInbound,
  countOtherInboundByTab,
  deleteOtherInbound,
  filterOtherInbounds,
} from '@/features/otherInbound/storage'
import type { OtherInbound, OtherInboundListFilters, OtherInboundStatusTabKey } from '@/features/otherInbound/types'
import { validateConfirm } from '@/features/otherInbound/validate'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: OtherInboundListFilters = {
  inboundNos: '',
  warehouseId: '',
  status: '',
  inboundDateFrom: '',
  inboundDateTo: '',
}

export function OtherInboundList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<OtherInboundStatusTabKey>('ALL')
  const [applied, setApplied] = useState(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<OtherInbound | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)

  const warehouses = useMemo(() => listWarehouses(), [refreshKey])
  const tabCounts = useMemo(() => countOtherInboundByTab(applied), [applied, refreshKey])

  const columns: ProColumns<OtherInbound>[] = [
    {
      title: '入库单号',
      dataIndex: 'inboundNo',
      width: 180,
      fixed: 'left',
      render: (_, r) => <Link to={`/inventory/other-inbound/${r.id}`}>{r.inboundNo}</Link>,
    },
    { title: '状态', width: 100, hideInSearch: true, render: (_, r) => <OtherInboundStatusTag status={r.status} /> },
    {
      title: '仓库',
      dataIndex: 'warehouseId',
      valueType: 'select',
      fieldProps: {
        options: warehouses.map((w) => ({ label: partnerLabel(w.warehouseCode, w.warehouseName), value: w.id })),
        allowClear: true,
      },
      render: (_, r) => partnerLabel(r.warehouseCode, r.warehouseName),
    },
    { title: '入库日期', dataIndex: 'inboundDate', valueType: 'date' },
    { title: '入库原因', dataIndex: 'reason', hideInSearch: true },
    { title: '总数量', dataIndex: 'totalQty', hideInSearch: true },
    { title: '入库单号', dataIndex: 'inboundNos', hideInTable: true },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => {
        const items = [
          <Typography.Link key="v" style={tableActionLinkStyle} onClick={() => navigate(`/inventory/other-inbound/${row.id}`)}>
            查看
          </Typography.Link>,
        ]
        if (row.status === 'DRAFT') {
          items.push(
            <Typography.Link key="e" style={tableActionLinkStyle} onClick={() => navigate(`/inventory/other-inbound/${row.id}/edit`)}>
              编辑
            </Typography.Link>,
            <Typography.Link key="c" style={tableActionLinkStyle} onClick={() => { setConfirmRow(row); setConfirmKind('confirm') }}>
              确认入库
            </Typography.Link>,
            <Typography.Link key="d" style={tableActionLinkStyle} onClick={() => { setConfirmRow(row); setConfirmKind('delete') }}>
              删除
            </Typography.Link>,
          )
        }
        return <TableRowActions items={items} />
      },
    },
  ]

  function runConfirm() {
    if (!confirmRow || !confirmKind) return
    if (confirmKind === 'delete') {
      if (deleteOtherInbound(confirmRow.id)) {
        setToast('已删除')
        setRefreshKey((k) => k + 1)
        actionRef.current?.reload()
      }
    } else {
      const err = validateConfirm(confirmRow)
      if (err) {
        setToast(err)
      } else if (confirmOtherInbound(confirmRow.id)) {
        setToast('确认入库成功')
        setRefreshKey((k) => k + 1)
        actionRef.current?.reload()
      }
    }
    setConfirmRow(null)
    setConfirmKind(null)
  }

  return (
    <PageContainer title="其他入库" data-anno="other-inbound-list">
      <div data-anno="other-inbound-tabs">
        <Tabs
          activeKey={tab}
          onChange={(k) => { setTab(k as OtherInboundStatusTabKey); actionRef.current?.reload() }}
          items={OTHER_INBOUND_TABS.map((t) => ({ key: t.key, label: tabCountLabel(t.label, tabCounts[t.key]) }))}
          style={{ marginBottom: 16 }}
        />
      </div>
      <div data-anno="other-inbound-filters">
        <ProTable<OtherInbound>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          params={{ tab, refreshKey }}
          request={async (params) => {
            const f = { ...defaultFilters, warehouseId: String(params.warehouseId ?? ''), inboundNos: String(params.inboundNos ?? '') }
            setApplied(f)
            const data = filterOtherInbounds(f, tab)
            const current = params.current ?? 1
            const pageSize = params.pageSize ?? 20
            const start = (current - 1) * pageSize
            return { data: data.slice(start, start + pageSize), success: true, total: data.length }
          }}
          cardProps={{ 'data-anno': 'other-inbound-table' } as HTMLAttributes<HTMLDivElement>}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
          scroll={{ x: 900 }}
          toolBarRender={() => [
            <Space key="tb" data-anno="other-inbound-list-toolbar">
              <Button key="n" type="primary" onClick={() => navigate('/inventory/other-inbound/new')}>新增</Button>
            </Space>,
          ]}
        />
      </div>
      <Modal
        open={Boolean(confirmRow && confirmKind)}
        title={confirmKind === 'delete' ? '删除' : '确认入库'}
        confirmLabel="确认"
        confirmVariant={confirmKind === 'delete' ? 'destructive' : 'default'}
        onClose={() => { setConfirmRow(null); setConfirmKind(null) }}
        onConfirm={runConfirm}
      >
        <Typography.Text type="secondary">确认执行？</Typography.Text>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
