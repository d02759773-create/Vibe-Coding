import { useMemo, useRef, useState, type HTMLAttributes } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Input, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
import { EnableDisableModal } from '@/components/master/EnableDisableModal'
import { StatusPill } from '@/components/StatusPill'
import { Toast } from '@/components/Toast'
import {
  PRODUCT_CATEGORIES,
  SALES_UNIT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from '@/features/products/constants'
import { formatDateTime, formatMoney } from '@/features/products/format'
import { listProducts, persistProducts } from '@/features/products/storage'
import type { Product, ProductListFilters, ProductStatus } from '@/features/products/types'

const PAGE_SIZE = 10

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function filterRows(all: Product[], applied: ProductListFilters): Product[] {
  const kw = applied.keyword.trim().toLowerCase()
  return all.filter((p) => {
    if (applied.category && p.category !== applied.category) return false
    if (applied.status && p.status !== applied.status) return false
    if (!kw) return true
    const hay = [p.productCode, p.productName, p.barcode ?? ''].join(' ').toLowerCase()
    return hay.includes(kw)
  })
}

export function ProductList() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [statusTarget, setStatusTarget] = useState<Product | null>(null)
  const [statusAction, setStatusAction] = useState<'enable' | 'disable' | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const allProducts = useMemo(() => {
    void refreshKey
    return listProducts()
  }, [refreshKey])

  function openStatusModal(product: Product, action: 'enable' | 'disable') {
    setStatusTarget(product)
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
      persistProducts(
        allProducts.map((p) =>
          p.id === statusTarget.id
            ? {
                ...p,
                status: 'DISABLED' as ProductStatus,
                disableReason: reason,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : p,
        ),
      )
      setToast('商品已停用')
    } else {
      persistProducts(
        allProducts.map((p) =>
          p.id === statusTarget.id
            ? {
                ...p,
                status: 'ENABLED' as ProductStatus,
                disableReason: null,
                updatedBy: '管理员',
                updatedAt: nowString(),
              }
            : p,
        ),
      )
      setToast('商品已启用')
    }
    closeStatusModal()
    setRefreshKey((k) => k + 1)
    actionRef.current?.reload()
  }

  const columns: ProColumns<Product>[] = [
    {
      title: '综合搜索',
      dataIndex: 'keyword',
      hideInTable: true,
      renderFormItem: () => <Input placeholder="商品编码 / 商品名称 / 条码" allowClear />,
    },
    {
      title: '商品分类',
      dataIndex: 'category',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        options: PRODUCT_CATEGORIES.map((c) => ({ label: c, value: c })),
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
    { title: '商品编码', dataIndex: 'productCode', width: 130, copyable: true, search: false },
    { title: '商品名称', dataIndex: 'productName', ellipsis: true, search: false },
    { title: '商品分类', dataIndex: 'category', width: 100, search: false },
    { title: '规格型号', dataIndex: 'specModel', width: 120, search: false },
    {
      title: '销售单位',
      dataIndex: 'salesUnit',
      width: 90,
      search: false,
      render: (_, row) => SALES_UNIT_OPTIONS.find((u) => u.value === row.salesUnit)?.label,
    },
    {
      title: '默认批发价',
      dataIndex: 'defaultWholesalePrice',
      width: 110,
      align: 'right',
      search: false,
      render: (_, row) => formatMoney(row.defaultWholesalePrice),
    },
    {
      title: '默认零售价',
      dataIndex: 'defaultRetailPrice',
      width: 110,
      align: 'right',
      search: false,
      render: (_, row) => formatMoney(row.defaultRetailPrice),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      search: false,
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
              onClick={() => navigate(`/master/products/${row.id}`)}
            >
              查看
            </Button>,
            <Button
              key="edit"
              type="link"
              size="small"
              style={tableActionLinkStyle}
              onClick={() => navigate(`/master/products/${row.id}/edit`)}
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
      title="商品管理"
      subTitle="查询、维护商品档案与启停用状态"
      data-anno="product-list-page"
      extra={
        <Space data-anno="product-list-toolbar">
          <Button type="primary" onClick={() => navigate('/master/products/new')}>
            新增商品
          </Button>
        </Space>
      }
    >
      <div data-anno="product-list-filters">
        <ProTable<Product>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          search={{ labelWidth: 'auto' }}
          cardProps={{ 'data-anno': 'product-list-table' } as HTMLAttributes<HTMLDivElement>}
        request={async (params) => {
          const applied: ProductListFilters = {
            keyword: String(params.keyword ?? ''),
            category: String(params.category ?? ''),
            status: (params.status ?? '') as ProductListFilters['status'],
          }
          const filtered = filterRows(allProducts, applied)
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
        scroll={{ x: 1100 }}
        options={false}
        columnEmptyText="暂无数据"
        />
      </div>

      <EnableDisableModal
        dataAnno="product-status-modal"
        open={Boolean(statusTarget && statusAction)}
        mode={statusAction ?? 'disable'}
        entityLabel="商品"
        maxReasonLength={100}
        disableReason={disableReason}
        disableReasonError={disableReasonError}
        enableHint="启用后商品可再次被下游单据引用。"
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
