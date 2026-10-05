import { useMemo, useRef, useState } from 'react'
import type { HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Input, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { EnableDisableModal } from '@/components/master/EnableDisableModal'
import { StatusPill } from '@/components/StatusPill'
import { Toast } from '@/components/Toast'
import { formatDateTime } from '@/features/products/format'
import {
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
  warehouseTypeLabel,
} from '@/features/warehouses/constants'
import {
  getMockInventoryQty,
  listWarehouses,
  persistWarehouses,
} from '@/features/warehouses/storage'
import type { Warehouse, WarehouseListFilters, WarehouseStatus } from '@/features/warehouses/types'

const PAGE_SIZE = 10

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function filterRows(all: Warehouse[], applied: WarehouseListFilters): Warehouse[] {
  const kw = applied.keyword.trim().toLowerCase()
  return all.filter((w) => {
    if (applied.warehouseType && w.warehouseType !== applied.warehouseType) return false
    if (applied.status && w.status !== applied.status) return false
    if (!kw) return true
    const hay = [w.warehouseCode, w.warehouseName, w.managerName].join(' ').toLowerCase()
    return hay.includes(kw)
  })
}

export function WarehouseList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Warehouse | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allWarehouses = useMemo(() => {
    void refreshKey
    return listWarehouses()
  }, [refreshKey])

  function tryOpenDisable(warehouse: Warehouse) {
    const qty = getMockInventoryQty(warehouse.id)
    if (qty > 0) {
      setToast('当前仓库仍有库存，请先处理后再停用')
      return
    }
    setStatusTarget(warehouse)
    setStatusAction('disable')
    setDisableReason('')
    setDisableReasonError('')
  }

  function openEnable(warehouse: Warehouse) {
    setStatusTarget(warehouse)
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
      const qty = getMockInventoryQty(statusTarget.id)
      if (qty > 0) {
        setToast('当前仓库仍有库存，请先处理后再停用')
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
      persistWarehouses(
        allWarehouses.map((w) =>
          w.id === statusTarget.id
            ? {
                ...w,
                status: 'DISABLED' as WarehouseStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: ts,
                disabledBy: '管理员',
                disabledAt: ts,
              }
            : w,
        ),
      )
      setToast('仓库已停用')
    } else {
      const ts = nowString()
      persistWarehouses(
        allWarehouses.map((w) =>
          w.id === statusTarget.id
            ? {
                ...w,
                status: 'ENABLED' as WarehouseStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: ts,
                enabledBy: '管理员',
                enabledAt: ts,
              }
            : w,
        ),
      )
      setToast('仓库已启用')
    }

    closeStatusModal()
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  const columns: ProColumns<Warehouse>[] = [
    {
      title: '综合搜索',
      dataIndex: 'keyword',
      hideInTable: true,
      renderFormItem: () => (
        <Input placeholder="仓库编码 / 仓库名称 / 负责人" allowClear />
      ),
    },
    {
      title: '仓库类型',
      dataIndex: 'warehouseType',
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
    {
      title: '仓库编码',
      dataIndex: 'warehouseCode',
      width: 140,
      copyable: true,
      fixed: 'left',
      search: false,
    },
    { title: '仓库名称', dataIndex: 'warehouseName', ellipsis: true, search: false },
    {
      title: '仓库类型',
      dataIndex: 'warehouseType',
      width: 120,
      search: false,
      render: (_, row) => warehouseTypeLabel(row.warehouseType),
    },
    { title: '负责人', dataIndex: 'managerName', width: 100, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      search: false,
      onHeaderCell: () =>
        ({ 'data-anno': 'warehouse-status-modal' }) as HTMLAttributes<HTMLTableCellElement>,
      render: (_, row) => <StatusPill status={row.status} />,
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
              onClick={() => navigate(`/master/warehouses/${row.id}`)}
            >
              查看
            </Button>,
            <Button
              key="edit"
              type="link"
              size="small"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/master/warehouses/${row.id}/edit`)}
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
                停用
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
      title="仓库管理"
      subTitle="维护仓库档案与启停用状态"
      extra={
        <Space data-anno="warehouse-list-toolbar">
          <Button type="primary" onClick={() => navigate('/master/warehouses/new')}>
            新增仓库
          </Button>
        </Space>
      }
      data-anno="warehouse-list-page"
    >
      <div data-anno="warehouse-list-filters">
        <ProTable<Warehouse>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          search={{ labelWidth: 'auto', defaultCollapsed: false }}
          cardProps={{
            'data-anno': 'warehouse-list-table',
          } as HTMLAttributes<HTMLDivElement>}
          request={async (params) => {
            const applied: WarehouseListFilters = {
              keyword: String(params.keyword ?? ''),
              warehouseType: (params.warehouseType ?? '') as WarehouseListFilters['warehouseType'],
              status: (params.status ?? '') as WarehouseListFilters['status'],
            }
            const filtered = filterRows(allWarehouses, applied)
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
          columnEmptyText="暂无仓库数据"
        />
      </div>

      <EnableDisableModal
        open={Boolean(statusTarget && statusAction)}
        mode={statusAction ?? 'disable'}
        entityLabel="仓库"
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
