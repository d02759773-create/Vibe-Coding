import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { partnerLabel } from '@/features/purchaseOrders/constants'
import { listProducts } from '@/features/products/storage'
import type { Product } from '@/features/products/types'

type ProductSelectModalProps = {
  open: boolean
  maxSelect: number
  existingProductIds: string[]
  onClose: () => void
  onConfirm: (products: Product[]) => void
}

export function ProductSelectModal({
  open,
  maxSelect,
  existingProductIds,
  onClose,
  onConfirm,
}: ProductSelectModalProps) {
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const products = useMemo(() => {
    return listProducts().filter((p) => p.status === 'ENABLED')
  }, [open])

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

  if (!open) return null

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        if (next.size >= maxSelect) return prev
        next.add(id)
      }
      return next
    })
  }

  function handleConfirm() {
    const picked = products.filter((p) => selected.has(p.id))
    onConfirm(picked)
    setSelected(new Set())
    setKeyword('')
    onClose()
  }

  function handleClose() {
    setSelected(new Set())
    setKeyword('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="关闭" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        data-anno="product-select-modal"
        className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border bg-background shadow-lg"
      >
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold">选择商品</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            最多还可选 {maxSelect} 件（已排除明细中已有商品）
          </p>
          <input
            className="mt-3 h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            placeholder="搜索编码/名称/条码"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-2 py-2 w-10" />
                <th className="px-2 py-2">商品编码</th>
                <th className="px-2 py-2">商品名称</th>
                <th className="px-2 py-2">默认采购价</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-muted-foreground">
                    无匹配商品
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/20">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                        disabled={!selected.has(p.id) && selected.size >= maxSelect}
                      />
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">{p.productCode}</td>
                    <td className="px-2 py-2">{p.productName}</td>
                    <td className="px-2 py-2">
                      {p.referencePurchasePrice != null ? `¥${p.referencePurchasePrice.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={selected.size === 0}>
            确认（{selected.size}）
          </Button>
        </div>
      </div>
    </div>
  )
}

export function formatProductOption(p: Product): string {
  return partnerLabel(p.productCode, p.productName)
}
