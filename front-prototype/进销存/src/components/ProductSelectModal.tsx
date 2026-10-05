import { useEffect, useMemo, useState } from 'react'
import { Input, Modal, Space, Table, Typography } from 'antd'
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface'
import { Button } from '@/components/ui/button'
import { listProducts } from '@/features/products/storage'
import type { Product } from '@/features/products/types'
import { partnerLabel } from '@/features/purchaseOrders/constants'

type PriceMode = 'purchase' | 'wholesale'

type ProductSelectModalProps = {
  open: boolean
  maxSelect: number
  existingProductIds: string[]
  priceMode?: PriceMode
  onClose: () => void
  onConfirm: (products: Product[]) => void
}

function priceLabel(mode: PriceMode): string {
  return mode === 'wholesale' ? '默认批发价' : '默认采购价'
}

function formatPrice(p: Product, mode: PriceMode): string {
  if (mode === 'wholesale') {
    return `¥${p.defaultWholesalePrice.toFixed(2)}`
  }
  return p.referencePurchasePrice != null ? `¥${p.referencePurchasePrice.toFixed(2)}` : '-'
}

export function ProductSelectModal({
  open,
  maxSelect,
  existingProductIds,
  priceMode = 'purchase',
  onClose,
  onConfirm,
}: ProductSelectModalProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const products = useMemo(() => listProducts().filter((p) => p.status === 'ENABLED'), [open])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return products.filter((p) => {
      if (existingProductIds.includes(p.id)) return false
      if (!kw) return true
      return (
        p.productCode.toLowerCase().includes(kw) ||
        p.productName.toLowerCase().includes(kw) ||
        (p.barcode ?? '').toLowerCase().includes(kw)
      )
    })
  }, [products, keyword, existingProductIds])

  useEffect(() => {
    if (!open) {
      setKeyword('')
      setSelectedRowKeys([])
    }
  }, [open])

  const columns: ColumnsType<Product> = useMemo(
    () => [
      {
        title: '商品编码',
        dataIndex: 'productCode',
        render: (code: string) => <Typography.Text code>{code}</Typography.Text>,
      },
      { title: '商品名称', dataIndex: 'productName', ellipsis: true },
      {
        title: priceLabel(priceMode),
        key: 'price',
        width: 120,
        render: (_, row) => formatPrice(row, priceMode),
      },
    ],
    [priceMode],
  )

  const rowSelection: TableRowSelection<Product> = {
    selectedRowKeys,
    onChange: (keys) => {
      const next = keys as string[]
      if (next.length <= maxSelect) setSelectedRowKeys(next)
    },
    getCheckboxProps: (record) => ({
      disabled:
        !selectedRowKeys.includes(record.id) && selectedRowKeys.length >= maxSelect,
    }),
  }

  function handleConfirm() {
    const picked = products.filter((p) => selectedRowKeys.includes(p.id))
    onConfirm(picked)
    onClose()
  }

  return (
    <Modal
      open={open}
      title="选择商品"
      width={720}
      destroyOnClose
      data-anno="product-select-modal"
      onCancel={onClose}
      footer={
        <Space>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={selectedRowKeys.length === 0}>
            确认（{selectedRowKeys.length}）
          </Button>
        </Space>
      }
    >
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        最多还可选 {maxSelect} 件（已排除明细中已有商品）
      </Typography.Text>
      <Input
        allowClear
        placeholder="搜索编码/名称/条码"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <Table<Product>
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 360 }}
        columns={columns}
        dataSource={filtered}
        rowSelection={rowSelection}
        locale={{ emptyText: '无匹配商品' }}
      />
    </Modal>
  )
}

export function formatProductOption(p: Product): string {
  return partnerLabel(p.productCode, p.productName)
}
