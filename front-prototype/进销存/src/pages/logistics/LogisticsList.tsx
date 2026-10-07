import { useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Input, Space } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { EnableDisableModal } from '@/components/master/EnableDisableModal'
import { StatusPill } from '@/components/StatusPill'
import { Toast } from '@/components/Toast'
import { formatDateTime } from '@/features/products/format'
import {
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
  displayServiceProvider,
  logisticsTypeLabel,
} from '@/features/logistics/constants'
import { listLogistics, persistLogistics, getMockOpenOutboundCount } from '@/features/logistics/storage'
import type { Logistics, LogisticsListFilters, LogisticsStatus } from '@/features/logistics/types'

const PAGE_SIZE = 10

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function contains(hay: string, needle: string): boolean {
  const n = needle.trim().toLowerCase()
  if (!n) return true
  return hay.toLowerCase().includes(n)
}

function filterRows(all: Logistics[], applied: LogisticsListFilters): Logistics[] {
  return all.filter((row) => {
    if (applied.logisticsType && row.logisticsType !== applied.logisticsType) return false
    if (applied.status && row.status !== applied.status) return false
    if (!contains(row.logisticsCode, applied.logisticsCode)) return false
    if (!contains(row.logisticsName, applied.logisticsName)) return false
    if (!contains(row.serviceProvider ?? '', applied.serviceProvider)) return false
    return true
  })
}

function paramsToFilters(params: Record<string, unknown>): LogisticsListFilters {
  return {
    logisticsCode: String(params.logisticsCode ?? ''),
    logisticsName: String(params.logisticsName ?? ''),
    logisticsType: (params.logisticsType ?? '') as LogisticsListFilters['logisticsType'],
    serviceProvider: String(params.serviceProvider ?? ''),
    status: (params.status ?? '') as LogisticsListFilters['status'],
  }
}

export function LogisticsList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Logistics | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allItems = useMemo(() => {
    void refreshKey
    return listLogistics()
  }, [refreshKey])

  function openDisable(row: Logistics) {
    if (getMockOpenOutboundCount(row.id) > 0) {
      setToast('存在未完结的销售出库单引用该物流方式，请先处理后再禁用')
      return
    }
    setStatusTarget(row)
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function openEnable(row: Logistics) {
    setStatusTarget(row)
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
      if (getMockOpenOutboundCount(statusTarget.id) > 0) {
        setToast('存在未完结的销售出库单引用该物流方式，请先处理后再禁用')
        return
      }
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      if (reason.length > 200) {
        setDisableReasonError('停用原因最多 200 个字符')
        return
      }
      const ts = nowString()
      persistLogistics(
        allItems.map((row) =>
          row.id === statusTarget.id
            ? {
                ...row,
                status: 'DISABLED' as LogisticsStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: ts,
                disabledBy: '管理员',
                disabledAt: ts,
              }
            : row,
        ),
      )
      setToast('物流方式已禁用')
    } else {
      const ts = nowString()
      persistLogistics(
        allItems.map((row) =>
          row.id === statusTarget.id
            ? {
                ...row,
                status: 'ENABLED' as LogisticsStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: ts,
                enabledBy: '管理员',
                enabledAt: ts,
              }
            : row,
        ),
      )
      setToast('物流方式已启用')
    }

    closeStatusModal()
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  const columns: ProColumns<Logistics>[] = [
    {
      title: '物流编码',
      dataIndex: 'logisticsCode',
      hideInTable: true,
      renderFormItem: () => <Input placeholder="请输入" allowClear />,
    },
    {
      title: '物流名称',
      dataIndex: 'logisticsName',
      hideInTable: true,
      renderFormItem: () => <Input placeholder="请输入" allowClear />,
    },
    {
      title: '物流类型',
      dataIndex: 'logisticsType',
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
      title: '物流服务商',
      dataIndex: 'serviceProvider',
      hideInTable: true,
      renderFormItem: () => <Input placeholder="请输入" allowClear />,
    },
    {
      title: '使用状态',
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
    {
      title: '物流编码',
      dataIndex: 'logisticsCode',
      width: 140,
      copyable: true,
      search: false,
      render: (_, row) => (
        <Link to={`/master/logistics/${row.id}`}>{row.logisticsCode}</Link>
      ),
    },
    { title: '物流名称', dataIndex: 'logisticsName', ellipsis: true, search: false },
    {
      title: '物流类型',
      dataIndex: 'logisticsType',
      width: 120,
      search: false,
      render: (_, row) => logisticsTypeLabel(row.logisticsType),
    },
    {
      title: '物流服务商',
      dataIndex: 'serviceProvider',
      width: 140,
      search: false,
      render: (_, row) => displayServiceProvider(row.serviceProvider),
    },
    {
      title: '使用状态',
      dataIndex: 'status',
      width: 100,
      search: false,
      render: (_, row) => <StatusPill status={row.status} disabledLabel="禁用" />,
    },
    {
      title: '最后修改时间',
      dataIndex: 'updatedAt',
      width: 170,
      search: false,
      render: (_, row) => formatDateTime(row.updatedAt),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
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
              onClick={() => navigate(`/master/logistics/${row.id}`)}
            >
              查看
            </Button>,
            <Button
              key="edit"
              type="link"
              size="small"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/master/logistics/${row.id}/edit`)}
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
                onClick={() => openDisable(row)}
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
      title="物流管理"
      subTitle="维护物流方式与使用状态"
      extra={
        <Space data-anno="logistics-list-toolbar">
          <Button type="primary" onClick={() => navigate('/master/logistics/new')}>
            新增
          </Button>
        </Space>
      }
      data-anno="logistics-list-page"
    >
      <div data-anno="logistics-list-filters">
        <ProTable<Logistics>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          search={{ labelWidth: 'auto', defaultCollapsed: false }}
          cardProps={{ 'data-anno': 'logistics-list-table' } as HTMLAttributes<HTMLDivElement>}
          request={async (params) => {
            const applied = paramsToFilters(params)
            const filtered = filterRows(allItems, applied)
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
          scroll={{ x: 960 }}
          options={false}
          columnEmptyText="暂无物流数据"
        />
      </div>

      <EnableDisableModal
        dataAnno="logistics-status-modal"
        open={Boolean(statusTarget && statusAction)}
        mode={statusAction ?? 'disable'}
        entityLabel="物流方式"
        maxReasonLength={200}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        enableHint="启用后该物流方式可再次被业务单据引用。"
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
