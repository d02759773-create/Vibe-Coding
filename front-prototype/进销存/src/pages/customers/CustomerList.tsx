import { useMemo, useRef, useState } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { EnableDisableModal } from '@/components/master/EnableDisableModal'
import { Toast } from '@/components/Toast'
import {
  customerGradeLabel,
  customerTypeLabel,
  GRADE_FILTER_OPTIONS,
  parseBatchCustomerCodes,
  settlementLabel,
  SETTLEMENT_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from '@/features/customers/constants'
import { getRealtimeReceivable } from '@/features/customers/receivable'
import { listCustomers, persistCustomers } from '@/features/customers/storage'
import type {
  Customer,
  CustomerListFilters,
  CustomerSortField,
  CustomerStatus,
} from '@/features/customers/types'
import { displayValue, formatMoney } from '@/features/products/format'

const PAGE_SIZE = 10

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function moneyCell(value: number) {
  return `¥${formatMoney(value)}`
}

function filterRows(all: Customer[], applied: CustomerListFilters): Customer[] {
  const codes = parseBatchCustomerCodes(applied.customerCode)
  const nameKw = applied.customerName.trim().toLowerCase()
  const spKw = applied.salesperson.trim().toLowerCase()

  return all.filter((c) => {
    if (codes.length > 0 && !codes.includes(c.customerCode)) return false
    if (applied.customerType && c.customerType !== applied.customerType) return false
    if (applied.customerGrade && c.customerGrade !== applied.customerGrade) return false
    if (applied.settlementMethod && c.settlementMethod !== applied.settlementMethod) return false
    if (nameKw && !c.customerName.toLowerCase().includes(nameKw)) return false
    if (spKw) {
      const sp = (c.salesperson ?? '').toLowerCase()
      if (!sp.includes(spKw)) return false
    }
    return true
  })
}

function sortRows(
  rows: Customer[],
  sortField: CustomerSortField | undefined,
  sortOrder: 'ascend' | 'descend' | undefined,
): Customer[] {
  if (!sortField || !sortOrder) return rows
  if (sortField !== 'openingArrears' && sortField !== 'openingBalance') return rows
  const asc = sortOrder === 'ascend'
  return [...rows].sort((a, b) => {
    const diff = a[sortField] - b[sortField]
    return asc ? diff : -diff
  })
}

function paramsToFilters(params: Record<string, unknown>): CustomerListFilters {
  return {
    customerCode: String(params.customerCode ?? ''),
    customerName: String(params.customerName ?? ''),
    customerType: (params.customerType ?? '') as CustomerListFilters['customerType'],
    customerGrade: (params.customerGrade ?? '') as CustomerListFilters['customerGrade'],
    salesperson: String(params.salesperson ?? ''),
    settlementMethod: (params.settlementMethod ?? '') as CustomerListFilters['settlementMethod'],
  }
}

export function CustomerList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Customer | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allCustomers = useMemo(() => {
    void refreshKey
    return listCustomers()
  }, [refreshKey])

  function tryOpenDisable(customer: Customer) {
    const receivable = getRealtimeReceivable(customer.id)
    if (receivable > 0) {
      setToast('该客户仍有未结清应收，请先收款或对账后再禁用')
      return
    }
    setStatusTarget(customer)
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function openEnable(customer: Customer) {
    setStatusTarget(customer)
    setStatusAction('enable')
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
      if (reason.length > 200) {
        setDisableReasonError('停用原因最多 200 个字符')
        return
      }
      persistCustomers(
        allCustomers.map((c) =>
          c.id === statusTarget.id
            ? {
                ...c,
                status: 'DISABLED' as CustomerStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : c,
        ),
      )
      setToast('客户已停用')
    } else {
      persistCustomers(
        allCustomers.map((c) =>
          c.id === statusTarget.id
            ? {
                ...c,
                status: 'ENABLED' as CustomerStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : c,
        ),
      )
      setToast('客户已启用')
    }

    closeStatusModal()
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  const columns: ProColumns<Customer>[] = [
    {
      title: '客户编码',
      dataIndex: 'customerCode',
      hideInTable: true,
      renderFormItem: () => <Input placeholder="可批量，精确匹配" allowClear />,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      hideInTable: true,
      renderFormItem: () => <Input placeholder="请输入" allowClear />,
    },
    {
      title: '客户类型',
      dataIndex: 'customerType',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        options: TYPE_FILTER_OPTIONS.filter((o) => o.value !== '').map((o) => ({
          label: o.label,
          value: o.value,
        })),
      },
    },
    {
      title: '客户等级',
      dataIndex: 'customerGrade',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        options: GRADE_FILTER_OPTIONS.filter((o) => o.value !== '').map((o) => ({
          label: o.label,
          value: o.value,
        })),
      },
    },
    {
      title: '归属业务员',
      dataIndex: 'salesperson',
      hideInTable: true,
      renderFormItem: () => <Input placeholder="请输入" allowClear />,
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
      title: '客户编码',
      dataIndex: 'customerCode',
      width: 130,
      copyable: true,
      search: false,
      render: (_, row) => (
        <Link to={`/master/customers/${row.id}`}>{row.customerCode}</Link>
      ),
    },
    { title: '客户名称', dataIndex: 'customerName', ellipsis: true, search: false },
    {
      title: '客户类型',
      dataIndex: 'customerType',
      width: 100,
      search: false,
      render: (_, row) => customerTypeLabel(row.customerType),
    },
    {
      title: '客户等级',
      dataIndex: 'customerGrade',
      width: 90,
      search: false,
      render: (_, row) => customerGradeLabel(row.customerGrade),
    },
    { title: '联系人', dataIndex: 'contactName', width: 100, search: false },
    { title: '联系电话', dataIndex: 'contactPhone', width: 130, search: false },
    {
      title: '归属业务员',
      dataIndex: 'salesperson',
      width: 110,
      search: false,
      render: (_, row) => displayValue(row.salesperson),
    },
    {
      title: '期初欠款',
      dataIndex: 'openingArrears',
      width: 120,
      align: 'right',
      search: false,
      sorter: true,
      render: (_, row) => moneyCell(row.openingArrears),
    },
    {
      title: '期初余额',
      dataIndex: 'openingBalance',
      width: 120,
      align: 'right',
      search: false,
      sorter: true,
      render: (_, row) => moneyCell(row.openingBalance),
    },
    {
      title: '结算方式',
      dataIndex: 'settlementMethod',
      width: 100,
      search: false,
      render: (_, row) => settlementLabel(row.settlementMethod),
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
              onClick={() => navigate(`/master/customers/${row.id}`)}
            >
              查看
            </Button>,
            <Button
              key="edit"
              type="link"
              size="small"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/master/customers/${row.id}/edit`)}
            >
              编辑
            </Button>,
            row.status === 'ENABLED' ? (
              <Button
                key="disable"
                type="link"
                size="small"
                danger
                style={tableActionLinkStyle}
                onClick={() => tryOpenDisable(row)}
              >
                禁用
              </Button>
            ) : (
              <Button
                key="enable"
                type="link"
                size="small"
                style={tableActionLinkStyle}
                onClick={() => openEnable(row)}
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
      title="客户管理"
      subTitle="维护客户档案、结算与信用额度"
      extra={
        <Button type="primary" onClick={() => navigate('/master/customers/new')}>
          新增
        </Button>
      }
    >
      <ProTable<Customer>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto', defaultCollapsed: true }}
        request={async (params, sort) => {
          const applied = paramsToFilters(params)
          let filtered = filterRows(allCustomers, applied)

          const sortEntries = Object.entries(sort ?? {})
          if (sortEntries.length > 0) {
            const [field, order] = sortEntries[0] as [CustomerSortField, 'ascend' | 'descend']
            filtered = sortRows(filtered, field, order)
          }

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
        scroll={{ x: 1200 }}
        options={false}
        columnEmptyText="暂无客户数据"
      />

      <EnableDisableModal
        open={Boolean(statusTarget && statusAction)}
        mode={statusAction ?? 'disable'}
        entityLabel="客户"
        maxReasonLength={200}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        enableHint="启用后客户可再次被销售等业务单据引用。"
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
