import { useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Space, Tabs, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { OtherOutboundStatusTag } from '@/components/OtherOutboundStatusTag'
import { OTHER_OUTBOUND_TABS, partnerLabel, tabCountLabel } from '@/features/otherOutbound/constants'
import {
  confirmOtherOutbound,
  countOtherOutboundByTab,
  deleteOtherOutbound,
  filterOtherOutbounds,
} from '@/features/otherOutbound/storage'
import type { OtherOutbound, OtherOutboundListFilters, OtherOutboundStatusTabKey } from '@/features/otherOutbound/types'
import { validateConfirm } from '@/features/otherOutbound/validate'
import { listWarehouses } from '@/features/warehouses/storage'

const defaultFilters: OtherOutboundListFilters = {
  outboundNos: '',
  warehouseId: '',
  status: '',
  outboundDateFrom: '',
  outboundDateTo: '',
}

export function OtherOutboundList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [tab, setTab] = useState<OtherOutboundStatusTabKey>('ALL')
  const [applied, setApplied] = useState(defaultFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<OtherOutbound | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)

  const warehouses = useMemo(() => listWarehouses(), [refreshKey])
  const tabCounts = useMemo(() => countOtherOutboundByTab(applied), [applied, refreshKey])

  const columns: ProColumns<OtherOutbound>[] = [
    {
      title: '出库单号',
      dataIndex: 'outboundNo',
      width: 180,
      fixed: 'left',
      render: (_, r) => <Link to={`/inventory/other-outbound/${r.id}`}>{r.outboundNo}</Link>,
    },
    { title: '状态', width: 100, hideInSearch: true, render: (_, r) => <OtherOutboundStatusTag status={r.status} /> },
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
    { title: '出库日期', dataIndex: 'outboundDate', valueType: 'date' },
    { title: '出库原因', dataIndex: 'reason', hideInSearch: true },
    { title: '总数量', dataIndex: 'totalQty', hideInSearch: true },
    { title: '出库单号', dataIndex: 'outboundNos', hideInTable: true },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => {
        const items = [
          <Typography.Link key="v" style={tableActionLinkStyle} onClick={() => navigate(`/inventory/other-outbound/${row.id}`)}>
            查看
          </Typography.Link>,
        ]
        if (row.status === 'DRAFT') {
          items.push(
            <Typography.Link key="e" style={tableActionLinkStyle} onClick={() => navigate(`/inventory/other-outbound/${row.id}/edit`)}>
              编辑
            </Typography.Link>,
            <Typography.Link key="c" style={tableActionLinkStyle} onClick={() => { setConfirmRow(row); setConfirmKind('confirm') }}>
              确认出库
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
      if (deleteOtherOutbound(confirmRow.id)) {
        setToast('已删除')
        setRefreshKey((k) => k + 1)
        actionRef.current?.reload()
      }
    } else {
      const err = validateConfirm(confirmRow)
      if (err) setToast(err)
      else if (confirmOtherOutbound(confirmRow.id)) {
        setToast('确认出库成功')
        setRefreshKey((k) => k + 1)
        actionRef.current?.reload()
      }
    }
    setConfirmRow(null)
    setConfirmKind(null)
  }

  return (
    <PageContainer title="其他出库" data-anno="other-outbound-list">
      <div data-anno="other-outbound-tabs">
        <Tabs
          activeKey={tab}
          onChange={(k) => { setTab(k as OtherOutboundStatusTabKey); actionRef.current?.reload() }}
          items={OTHER_OUTBOUND_TABS.map((t) => ({ key: t.key, label: tabCountLabel(t.label, tabCounts[t.key]) }))}
          style={{ marginBottom: 16 }}
        />
      </div>
      <div data-anno="other-outbound-filters">
        <ProTable<OtherOutbound>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          params={{ tab, refreshKey }}
          request={async (params) => {
            const f = { ...defaultFilters, warehouseId: String(params.warehouseId ?? ''), outboundNos: String(params.outboundNos ?? '') }
            setApplied(f)
            const data = filterOtherOutbounds(f, tab)
            const current = params.current ?? 1
            const pageSize = params.pageSize ?? 20
            const start = (current - 1) * pageSize
            return { data: data.slice(start, start + pageSize), success: true, total: data.length }
          }}
          cardProps={{ 'data-anno': 'other-outbound-table' } as HTMLAttributes<HTMLDivElement>}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
          scroll={{ x: 900 }}
          toolBarRender={() => [
            <Space key="tb" data-anno="other-outbound-list-toolbar">
              <Button key="n" type="primary" onClick={() => navigate('/inventory/other-outbound/new')}>新增</Button>
            </Space>,
          ]}
        />
      </div>
      <Modal open={Boolean(confirmRow && confirmKind)} title={confirmKind === 'delete' ? '删除' : '确认出库'} confirmLabel="确认" onClose={() => { setConfirmRow(null); setConfirmKind(null) }} onConfirm={runConfirm}>
        <Typography.Text type="secondary">确认执行？</Typography.Text>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
