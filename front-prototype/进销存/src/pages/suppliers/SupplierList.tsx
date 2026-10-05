import { useMemo, useRef, useState } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { EnableDisableModal } from '@/components/master/EnableDisableModal'
import { StatusPill } from '@/components/StatusPill'
import { Toast } from '@/components/Toast'
import {
  SETTLEMENT_FILTER_OPTIONS,
  settlementLabel,
  STATUS_FILTER_OPTIONS,
} from '@/features/suppliers/constants'
import { displayValue } from '@/features/products/format'
import { listSuppliers, persistSuppliers } from '@/features/suppliers/storage'
import type { Supplier, SupplierListFilters, SupplierStatus } from '@/features/suppliers/types'

const PAGE_SIZE = 10

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function filterRows(all: Supplier[], applied: SupplierListFilters): Supplier[] {
  const kw = applied.keyword.trim().toLowerCase()
  return all.filter((s) => {
    if (applied.settlementMethod && s.settlementMethod !== applied.settlementMethod) return false
    if (applied.status && s.status !== applied.status) return false
    if (!kw) return true
    const hay = [s.supplierCode, s.supplierName, s.contactName].join(' ').toLowerCase()
    return hay.includes(kw)
  })
}

export function SupplierList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusTarget, setStatusTarget] = useState<Supplier | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allSuppliers = useMemo(() => {
    void refreshKey
    return listSuppliers()
  }, [refreshKey])

  function openStatusModal(supplier: Supplier, action: 'enable' | 'disable') {
    setStatusTarget(supplier)
    setStatusAction(action)
    setDisableReason('')
    setDisableReasonError('')
  }

  function closeStatusModal() {
    setStatusTarget(null)
    setStatusAction(null)
    setDisableReason('')
    setDisableReasonError('')
  }

  function confirmStatusChange() {
    if (!statusTarget || !statusAction) return
    if (statusAction === 'disable') {
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      if (reason.length > 100) {
        setDisableReasonError('停用原因最多 100 个字符')
        return
      }
      persistSuppliers(
        allSuppliers.map((s) =>
          s.id === statusTarget.id
            ? {
                ...s,
                status: 'DISABLED' as SupplierStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : s,
        ),
      )
      setToast('供应商已停用')
    } else {
      persistSuppliers(
        allSuppliers.map((s) =>
          s.id === statusTarget.id
            ? {
                ...s,
                status: 'ENABLED' as SupplierStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : s,
        ),
      )
      setToast('供应商已启用')
    }
    closeStatusModal()
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  const columns: ProColumns<Supplier>[] = [
    {
      title: '综合搜索',
      dataIndex: 'keyword',
      hideInTable: true,
      renderFormItem: () => <Input placeholder="供应商编码 / 名称 / 联系人" allowClear />,
    },
    {
      title: '结算方式',
      dataIndex: 'settlementMethod',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        options: SETTLEMENT_FILTER_OPTIONS.filter((o) => o.value !== '').map((o) => ({
          label: o.label,
          value: o.value,
        })),
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        options: STATUS_FILTER_OPTIONS.filter((o) => o.value !== '').map((o) => ({
          label: o.label,
          value: o.value,
        })),
      },
    },
    { title: '供应商编码', dataIndex: 'supplierCode', width: 130, copyable: true, search: false },
    { title: '供应商名称', dataIndex: 'supplierName', ellipsis: true, search: false },
    { title: '联系人', dataIndex: 'contactName', width: 100, search: false },
    { title: '联系电话', dataIndex: 'contactPhone', width: 130, search: false },
    {
      title: '结算方式',
      dataIndex: 'settlementMethod',
      width: 100,
      search: false,
      render: (_, row) => settlementLabel(row.settlementMethod),
    },
    { title: '账期天数', dataIndex: 'paymentTermDays', width: 90, search: false },
    {
      title: '税率',
      dataIndex: 'taxRate',
      width: 80,
      search: false,
      render: (_, row) => displayValue(row.taxRate),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      search: false,
      render: (_, row) => <StatusPill status={row.status} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      search: false,
      render: (_, row) => (
        <TableRowActions
          items={[
            <Button
              key="view"
              type="link"
              size="small"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/master/suppliers/${row.id}`)}
            >
              查看
            </Button>,
            <Button
              key="edit"
              type="link"
              size="small"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/master/suppliers/${row.id}/edit`)}
            >
              编辑
            </Button>,
            row.status === 'ENABLED' ? (
              <Button
                key="off"
                type="link"
                size="small"
                danger
                style={tableActionLinkStyle}
                onClick={() => openStatusModal(row, 'disable')}
              >
                停用
              </Button>
            ) : (
              <Button
                key="on"
                type="link"
                size="small"
                style={tableActionLinkStyle}
                onClick={() => openStatusModal(row, 'enable')}
              >
                启用
              </Button>
            ),
          ]}
        />
      ),
    },
  ]

  return (
    <PageContainer
      title="供应商管理"
      subTitle="查询、维护供应商档案与结算规则"
      extra={
        <Button type="primary" onClick={() => navigate('/master/suppliers/new')}>
          新增供应商
        </Button>
      }
    >
      <ProTable<Supplier>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const applied: SupplierListFilters = {
            keyword: String(params.keyword ?? ''),
            settlementMethod: (params.settlementMethod ??
              '') as SupplierListFilters['settlementMethod'],
            status: (params.status ?? '') as SupplierListFilters['status'],
          }
          const filtered = filterRows(allSuppliers, applied)
          const current = params.current ?? 1
          const pageSize = params.pageSize ?? PAGE_SIZE
          const start = (current - 1) * pageSize
          return {
            data: filtered.slice(start, start + pageSize),
            success: true,
            total: filtered.length,
          }
        }}
        params={{ refreshKey }}
        pagination={{ defaultPageSize: PAGE_SIZE, showSizeChanger: true }}
        scroll={{ x: 1000 }}
        options={false}
        columnEmptyText="暂无数据"
      />

      <EnableDisableModal
        open={Boolean(statusTarget && statusAction)}
        mode={statusAction ?? 'disable'}
        entityLabel="供应商"
        maxReasonLength={100}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        onReasonChange={(v) => {
          setDisableReason(v)
          if (disableReasonError) setDisableReasonError('')
        }}
        onClose={closeStatusModal}
        onConfirm={confirmStatusChange}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
