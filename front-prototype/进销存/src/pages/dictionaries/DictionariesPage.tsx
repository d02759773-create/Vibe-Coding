import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/StatusPill'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { formatDateTime } from '@/features/products/format'
import {
  STATUS_FILTER_OPTIONS,
  STRUCTURE_FILTER_OPTIONS,
  TYPE_CODE_PATTERN,
  displayDash,
  structureTypeLabel,
} from '@/features/dictionaries/constants'
import {
  getDictionaryType,
  hasChildItems,
  itemCodeExists,
  listDictionaryItems,
  listDictionaryItemsForTree,
  listDictionaryTypes,
  listLevelOneItems,
  nextDictionaryItemId,
  nextDictionaryTypeId,
  nowString,
  setDictionaryItemStatus,
  setDictionaryTypeStatus,
  typeCodeExists,
  upsertDictionaryItem,
  upsertDictionaryType,
} from '@/features/dictionaries/storage'
import type {
  DictionaryItem,
  DictionaryItemFilters,
  DictionaryStatus,
  DictionaryType,
  DictionaryTypeFilters,
  StructureType,
} from '@/features/dictionaries/types'

const defaultTypeFilters: DictionaryTypeFilters = {
  typeName: '',
  typeCode: '',
  structureType: '',
  status: '',
}

const defaultItemFilters: DictionaryItemFilters = {
  itemCode: '',
  itemName: '',
  status: '',
}

const inputClass =
  'h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const textareaClass =
  'min-h-20 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

type StatusModalState =
  | { kind: 'type'; target: DictionaryType; action: 'enable' | 'disable' }
  | { kind: 'item'; target: DictionaryItem; action: 'enable' | 'disable' }
  | null

type TypeFormState = { mode: 'new' } | { mode: 'edit'; type: DictionaryType } | null

type ItemFormState =
  | { mode: 'new'; level: 1 | 2 }
  | { mode: 'edit'; item: DictionaryItem }
  | null

export function DictionariesPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [typeFilters, setTypeFilters] = useState(defaultTypeFilters)
  const [appliedTypeFilters, setAppliedTypeFilters] = useState(defaultTypeFilters)
  const [selectedTypeCode, setSelectedTypeCode] = useState<string | null>(null)

  const [itemFilters, setItemFilters] = useState(defaultItemFilters)
  const [appliedItemFilters, setAppliedItemFilters] = useState(defaultItemFilters)

  const [statusModal, setStatusModal] = useState<StatusModalState>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableReasonError, setDisableReasonError] = useState('')

  const [typeForm, setTypeForm] = useState<TypeFormState>(null)
  const [typeFormCode, setTypeFormCode] = useState('')
  const [typeFormName, setTypeFormName] = useState('')
  const [typeFormStructure, setTypeFormStructure] = useState<StructureType>('FLAT')
  const [typeFormDesc, setTypeFormDesc] = useState('')
  const [typeFormErrors, setTypeFormErrors] = useState<Record<string, string>>({})

  const [typeDetail, setTypeDetail] = useState<DictionaryType | null>(null)

  const [itemForm, setItemForm] = useState<ItemFormState>(null)
  const [itemFormCode, setItemFormCode] = useState('')
  const [itemFormName, setItemFormName] = useState('')
  const [itemFormParent, setItemFormParent] = useState('')
  const [itemFormSort, setItemFormSort] = useState(0)
  const [itemFormRemark, setItemFormRemark] = useState('')
  const [itemFormErrors, setItemFormErrors] = useState<Record<string, string>>({})

  const [itemDetail, setItemDetail] = useState<DictionaryItem | null>(null)

  const types = useMemo(() => {
    void refreshKey
    return listDictionaryTypes(appliedTypeFilters)
  }, [refreshKey, appliedTypeFilters])

  const selectedType = selectedTypeCode ? getDictionaryType(selectedTypeCode) : undefined

  const items = useMemo(() => {
    void refreshKey
    if (!selectedTypeCode) return []
    if (selectedType?.structureType === 'TREE') {
      return listDictionaryItemsForTree(selectedTypeCode, appliedItemFilters)
    }
    return listDictionaryItems(selectedTypeCode, appliedItemFilters)
  }, [refreshKey, selectedTypeCode, selectedType?.structureType, appliedItemFilters])

  function bumpRefresh() {
    setRefreshKey((k) => k + 1)
  }

  function handleTypeSearch() {
    setAppliedTypeFilters({ ...typeFilters })
  }

  function handleTypeReset() {
    setTypeFilters(defaultTypeFilters)
    setAppliedTypeFilters(defaultTypeFilters)
  }

  function handleItemSearch() {
    setAppliedItemFilters({ ...itemFilters })
  }

  function handleItemReset() {
    setItemFilters(defaultItemFilters)
    setAppliedItemFilters(defaultItemFilters)
  }

  function openTypeForm(mode: 'new' | 'edit', type?: DictionaryType) {
    if (mode === 'new') {
      setTypeForm({ mode: 'new' })
      setTypeFormCode('')
      setTypeFormName('')
      setTypeFormStructure('FLAT')
      setTypeFormDesc('')
    } else if (type) {
      setTypeForm({ mode: 'edit', type })
      setTypeFormCode(type.typeCode)
      setTypeFormName(type.typeName)
      setTypeFormStructure(type.structureType)
      setTypeFormDesc(type.description ?? '')
    }
    setTypeFormErrors({})
  }

  function closeTypeForm() {
    setTypeForm(null)
    setTypeFormErrors({})
  }

  function saveTypeForm() {
    const errors: Record<string, string> = {}
    const code = typeFormCode.trim().toUpperCase()
    const name = typeFormName.trim()
    if (!code) errors.typeCode = '类型编码不能为空'
    else if (!TYPE_CODE_PATTERN.test(code)) errors.typeCode = '类型编码格式不正确'
    if (!name) errors.typeName = '类型名称不能为空'
    else if (name.length > 50) errors.typeName = '类型名称最多 50 个字符'
    if (typeForm?.mode === 'new' && typeCodeExists(code)) errors.typeCode = '类型编码已存在'
    if (typeFormDesc.length > 200) errors.typeDescription = '类型说明最多 200 个字符'

    if (Object.keys(errors).length) {
      setTypeFormErrors(errors)
      return
    }

    const ts = nowString()
    if (typeForm?.mode === 'new') {
      upsertDictionaryType({
        id: nextDictionaryTypeId(),
        typeCode: code,
        typeName: name,
        structureType: typeFormStructure,
        description: typeFormDesc.trim() || null,
        isPreset: false,
        status: 'ENABLED',
        disableReason: null,
        createdBy: '管理员',
        createdAt: ts,
        updatedBy: '管理员',
        updatedAt: ts,
        disabledBy: null,
        disabledAt: null,
        enabledBy: '管理员',
        enabledAt: ts,
      })
      setSelectedTypeCode(code)
    } else if (typeForm?.mode === 'edit') {
      upsertDictionaryType({
        ...typeForm.type,
        typeName: name,
        description: typeFormDesc.trim() || null,
        updatedBy: '管理员',
        updatedAt: ts,
      })
    }

    setToast('保存成功')
    closeTypeForm()
    bumpRefresh()
  }

  function openItemForm(state: ItemFormState) {
    if (!selectedType) return
    if (state?.mode === 'new') {
      setItemForm(state)
      setItemFormCode('')
      setItemFormName('')
      setItemFormParent(state.level === 2 ? listLevelOneItems(selectedType.typeCode)[0]?.itemCode ?? '' : '')
      setItemFormSort(0)
      setItemFormRemark('')
    } else if (state?.mode === 'edit') {
      setItemForm(state)
      setItemFormCode(state.item.itemCode)
      setItemFormName(state.item.itemName)
      setItemFormParent(state.item.parentItemCode ?? '')
      setItemFormSort(state.item.sortOrder)
      setItemFormRemark(state.item.remark ?? '')
    }
    setItemFormErrors({})
  }

  function closeItemForm() {
    setItemForm(null)
    setItemFormErrors({})
  }

  function saveItemForm() {
    if (!itemForm || !selectedType) return
    const errors: Record<string, string> = {}
    const code = itemFormCode.trim()
    const name = itemFormName.trim()
    if (!code) errors.itemCode = '项编码不能为空'
    else if (code.length > 32) errors.itemCode = '项编码最多 32 个字符'
    if (!name) errors.itemName = '项名称不能为空'
    else if (name.length > 50) errors.itemName = '项名称最多 50 个字符'

    const editId = itemForm.mode === 'edit' ? itemForm.item.id : undefined
    if (itemCodeExists(selectedType.typeCode, code, editId)) {
      errors.itemCode = '同类型下项编码已存在'
    }

    let level: 1 | 2 = 1
    let parent: string | null = null

    if (selectedType.structureType === 'TREE') {
      if (itemForm.mode === 'new' && itemForm.level === 2) {
        level = 2
        parent = itemFormParent.trim()
        if (!parent) errors.parentItemCode = '请选择一级父项'
        else {
          const parentItem = listLevelOneItems(selectedType.typeCode).find((p) => p.itemCode === parent)
          if (!parentItem) errors.parentItemCode = '父项必须是一级节点'
        }
      } else if (itemForm.mode === 'edit') {
        level = itemForm.item.level
        if (level === 2) {
          parent = itemFormParent.trim()
          if (!parent) errors.parentItemCode = '请选择一级父项'
        } else {
          parent = null
        }
      } else {
        level = 1
        parent = null
      }
    }

    if (itemFormRemark.length > 200) errors.itemRemark = '项备注最多 200 个字符'
    if (itemFormSort < 0 || itemFormSort > 9999) errors.sortOrder = '排序号范围 0–9999'

    if (Object.keys(errors).length) {
      setItemFormErrors(errors)
      return
    }

    const ts = nowString()
    const baseSys =
      itemForm.mode === 'edit'
        ? {
            createdBy: itemForm.item.createdBy,
            createdAt: itemForm.item.createdAt,
            enabledBy: itemForm.item.enabledBy,
            enabledAt: itemForm.item.enabledAt,
            disabledBy: itemForm.item.disabledBy,
            disabledAt: itemForm.item.disabledAt,
          }
        : {
            createdBy: '管理员',
            createdAt: ts,
            enabledBy: '管理员',
            enabledAt: ts,
            disabledBy: null as string | null,
            disabledAt: null as string | null,
          }

    const referenced = itemForm.mode === 'edit' ? itemForm.item.referenced : false
    const status: DictionaryStatus =
      itemForm.mode === 'edit' ? itemForm.item.status : 'ENABLED'
    const disableReason =
      itemForm.mode === 'edit' ? itemForm.item.disableReason : null

    upsertDictionaryItem({
      id: itemForm.mode === 'edit' ? itemForm.item.id : nextDictionaryItemId(),
      typeCode: selectedType.typeCode,
      itemCode: code,
      itemName: name,
      parentItemCode: parent,
      level,
      isLeaf: true,
      sortOrder: itemFormSort,
      remark: itemFormRemark.trim() || null,
      status,
      disableReason,
      referenced,
      ...baseSys,
      updatedBy: '管理员',
      updatedAt: ts,
    })

    setToast('保存成功')
    closeItemForm()
    bumpRefresh()
  }

  function openStatusModal(state: StatusModalState) {
    setStatusModal(state)
    setDisableReason('')
    setDisableReasonError('')
  }

  function closeStatusModal() {
    setStatusModal(null)
    setDisableReason('')
    setDisableReasonError('')
  }

  function confirmStatusModal() {
    if (!statusModal) return
    if (statusModal.action === 'disable') {
      const reason = disableReason.trim()
      if (!reason) {
        setDisableReasonError('停用原因不能为空')
        return
      }
      if (reason.length > 200) {
        setDisableReasonError('停用原因最多 200 个字符')
        return
      }
      if (statusModal.kind === 'type') {
        setDictionaryTypeStatus(statusModal.target.id, 'DISABLED', reason)
        setToast('字典类型已禁用')
      } else {
        setDictionaryItemStatus(statusModal.target.id, 'DISABLED', reason)
        setToast('字典项已禁用')
      }
    } else {
      if (statusModal.kind === 'type') {
        setDictionaryTypeStatus(statusModal.target.id, 'ENABLED', null)
        setToast('字典类型已启用')
      } else {
        setDictionaryItemStatus(statusModal.target.id, 'ENABLED', null)
        setToast('字典项已启用')
      }
    }
    closeStatusModal()
    bumpRefresh()
    if (typeDetail && statusModal.kind === 'type' && statusModal.target.id === typeDetail.id) {
      setTypeDetail(getDictionaryType(typeDetail.typeCode) ?? null)
    }
    if (itemDetail && statusModal.kind === 'item' && statusModal.target.id === itemDetail.id) {
      const refreshed = listDictionaryItems(itemDetail.typeCode).find((i) => i.id === itemDetail.id)
      setItemDetail(refreshed ?? null)
    }
  }

  const levelOneOptions = selectedType ? listLevelOneItems(selectedType.typeCode) : []

  const itemCodeReadonly = itemForm?.mode === 'edit' && itemForm.item.referenced

  return (
    <div className="space-y-4" data-anno="dictionaries-page">
      <div data-anno="dictionaries-toolbar">
        <p className="text-sm text-muted-foreground">基础资料 / 数据字典</p>
        <h2 className="text-xl font-semibold tracking-tight">数据字典</h2>
        <p className="text-sm text-muted-foreground">维护字典类型与字典项，供档案与单据引用</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section
          className="w-full shrink-0 space-y-3 rounded-xl border bg-card p-4 lg:w-[380px]"
          data-anno="dictionaries-type-panel"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">字典类型</h3>
            <Button type="button" size="sm" onClick={() => openTypeForm('new')}>
              新增类型
            </Button>
          </div>

          <div className="grid gap-2 text-sm">
            <label className="grid gap-1">
              <span className="text-muted-foreground">类型名称</span>
              <input
                className={inputClass}
                value={typeFilters.typeName}
                onChange={(e) => setTypeFilters((f) => ({ ...f, typeName: e.target.value }))}
                placeholder="请输入"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-muted-foreground">类型编码</span>
              <input
                className={inputClass}
                value={typeFilters.typeCode}
                onChange={(e) => setTypeFilters((f) => ({ ...f, typeCode: e.target.value }))}
                placeholder="请输入"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-muted-foreground">结构类型</span>
                <select
                  className={inputClass}
                  value={typeFilters.structureType}
                  onChange={(e) =>
                    setTypeFilters((f) => ({
                      ...f,
                      structureType: e.target.value as DictionaryTypeFilters['structureType'],
                    }))
                  }
                >
                  {STRUCTURE_FILTER_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-muted-foreground">使用状态</span>
                <select
                  className={inputClass}
                  value={typeFilters.status}
                  onChange={(e) =>
                    setTypeFilters((f) => ({
                      ...f,
                      status: e.target.value as DictionaryTypeFilters['status'],
                    }))
                  }
                >
                  {STATUS_FILTER_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleTypeReset}>
                重置
              </Button>
              <Button type="button" size="sm" onClick={handleTypeSearch}>
                搜索
              </Button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-2 py-2 font-medium">类型</th>
                  <th className="px-2 py-2 font-medium">状态</th>
                  <th className="px-2 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {types.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-2 py-8 text-center text-muted-foreground">
                      暂无字典类型
                    </td>
                  </tr>
                ) : (
                  types.map((row) => {
                    const active = selectedTypeCode === row.typeCode
                    return (
                      <tr
                        key={row.id}
                        className={`border-b last:border-b-0 ${active ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                      >
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => setSelectedTypeCode(row.typeCode)}
                          >
                            <div className="font-medium">{row.typeName}</div>
                            <div className="font-mono text-xs text-muted-foreground">{row.typeCode}</div>
                            <div className="text-xs text-muted-foreground">
                              {structureTypeLabel(row.structureType)}
                            </div>
                          </button>
                        </td>
                        <td className="px-2 py-2 align-top">
                          <StatusPill status={row.status} disabledLabel="禁用" />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <button
                              type="button"
                              className="text-left text-primary hover:underline"
                              onClick={() => setTypeDetail(row)}
                            >
                              查看
                            </button>
                            <button
                              type="button"
                              className="text-left text-primary hover:underline"
                              onClick={() => openTypeForm('edit', row)}
                            >
                              编辑
                            </button>
                            {row.status === 'ENABLED' ? (
                              <button
                                type="button"
                                className="text-left text-destructive hover:underline"
                                onClick={() =>
                                  openStatusModal({ kind: 'type', target: row, action: 'disable' })
                                }
                              >
                                禁用
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="text-left text-primary hover:underline"
                                onClick={() =>
                                  openStatusModal({ kind: 'type', target: row, action: 'enable' })
                                }
                              >
                                启用
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="min-w-0 flex-1 space-y-3 rounded-xl border bg-card p-4"
          data-anno="dictionaries-item-panel"
        >
          {!selectedType ? (
            <p className="py-16 text-center text-muted-foreground">请先在左侧选择字典类型</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">
                    {selectedType.typeName}
                    <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                      ({selectedType.typeCode})
                    </span>
                  </h3>
                  <span className="mt-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-xs">
                    {structureTypeLabel(selectedType.structureType)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedType.structureType === 'TREE' ? (
                    <>
                      <Button type="button" size="sm" variant="outline" onClick={() => openItemForm({ mode: 'new', level: 1 })}>
                        新增一级项
                      </Button>
                      <Button type="button" size="sm" onClick={() => openItemForm({ mode: 'new', level: 2 })}>
                        新增二级项
                      </Button>
                    </>
                  ) : (
                    <Button type="button" size="sm" onClick={() => openItemForm({ mode: 'new', level: 1 })}>
                      新增字典项
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <label className="grid gap-1">
                  <span className="text-muted-foreground">项编码</span>
                  <input
                    className={inputClass}
                    value={itemFilters.itemCode}
                    onChange={(e) => setItemFilters((f) => ({ ...f, itemCode: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-muted-foreground">项名称</span>
                  <input
                    className={inputClass}
                    value={itemFilters.itemName}
                    onChange={(e) => setItemFilters((f) => ({ ...f, itemName: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-muted-foreground">使用状态</span>
                  <select
                    className={inputClass}
                    value={itemFilters.status}
                    onChange={(e) =>
                      setItemFilters((f) => ({
                        ...f,
                        status: e.target.value as DictionaryItemFilters['status'],
                      }))
                    }
                  >
                    {STATUS_FILTER_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end gap-2 md:col-span-3">
                  <Button type="button" variant="outline" size="sm" onClick={handleItemReset}>
                    重置
                  </Button>
                  <Button type="button" size="sm" onClick={handleItemSearch}>
                    搜索
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      {selectedType.structureType === 'TREE' ? (
                        <>
                          <th className="px-3 py-2.5 font-medium">项名称</th>
                          <th className="px-3 py-2.5 font-medium">项编码</th>
                          <th className="px-3 py-2.5 font-medium">层级</th>
                          <th className="px-3 py-2.5 font-medium">是否叶子</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-2.5 font-medium">项编码</th>
                          <th className="px-3 py-2.5 font-medium">项名称</th>
                        </>
                      )}
                      <th className="px-3 py-2.5 font-medium">排序号</th>
                      <th className="px-3 py-2.5 font-medium">使用状态</th>
                      <th className="px-3 py-2.5 font-medium">最后修改时间</th>
                      <th className="px-3 py-2.5 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={selectedType.structureType === 'TREE' ? 8 : 6}
                          className="px-3 py-10 text-center text-muted-foreground"
                        >
                          暂无字典项
                        </td>
                      </tr>
                    ) : (
                      items.map((row) => (
                        <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/20">
                          {selectedType.structureType === 'TREE' ? (
                            <>
                              <td className="px-3 py-2.5">
                                <span style={{ paddingLeft: row.level === 2 ? 24 : 0 }}>{row.itemName}</span>
                              </td>
                              <td className="px-3 py-2.5 font-mono text-xs">{row.itemCode}</td>
                              <td className="px-3 py-2.5">{row.level}</td>
                              <td className="px-3 py-2.5">{row.isLeaf ? '是' : '否'}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2.5 font-mono text-xs">{row.itemCode}</td>
                              <td className="px-3 py-2.5">{row.itemName}</td>
                            </>
                          )}
                          <td className="px-3 py-2.5">{row.sortOrder}</td>
                          <td className="px-3 py-2.5">
                            <StatusPill status={row.status} disabledLabel="禁用" />
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                            {formatDateTime(row.updatedAt)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-2 text-sm">
                              <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => setItemDetail(row)}
                              >
                                查看
                              </button>
                              <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => openItemForm({ mode: 'edit', item: row })}
                              >
                                编辑
                              </button>
                              {row.status === 'ENABLED' ? (
                                <button
                                  type="button"
                                  className="text-destructive hover:underline"
                                  onClick={() =>
                                    openStatusModal({ kind: 'item', target: row, action: 'disable' })
                                  }
                                >
                                  禁用
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="text-primary hover:underline"
                                  onClick={() =>
                                    openStatusModal({ kind: 'item', target: row, action: 'enable' })
                                  }
                                >
                                  启用
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {/* 类型表单 */}
      <Modal
        open={Boolean(typeForm)}
        title={typeForm?.mode === 'edit' ? '编辑字典类型' : '新增字典类型'}
        confirmLabel="保存"
        onClose={closeTypeForm}
        onConfirm={saveTypeForm}
        dataAnno="dictionaries-type-form"
      >
        <div className="grid gap-3 text-sm">
          <label className="grid gap-1">
            <span>
              类型编码 <span className="text-destructive">*</span>
            </span>
            <input
              className={inputClass}
              value={typeFormCode}
              readOnly={typeForm?.mode === 'edit'}
              disabled={typeForm?.mode === 'edit'}
              onChange={(e) => setTypeFormCode(e.target.value.toUpperCase())}
              placeholder="RETURN_REASON"
            />
            {typeFormErrors.typeCode ? (
              <span className="text-xs text-destructive">{typeFormErrors.typeCode}</span>
            ) : null}
          </label>
          <label className="grid gap-1">
            <span>
              类型名称 <span className="text-destructive">*</span>
            </span>
            <input
              className={inputClass}
              value={typeFormName}
              onChange={(e) => setTypeFormName(e.target.value)}
            />
            {typeFormErrors.typeName ? (
              <span className="text-xs text-destructive">{typeFormErrors.typeName}</span>
            ) : null}
          </label>
          <label className="grid gap-1">
            <span>
              结构类型 <span className="text-destructive">*</span>
            </span>
            <select
              className={inputClass}
              value={typeFormStructure}
              disabled={typeForm?.mode === 'edit'}
              onChange={(e) => setTypeFormStructure(e.target.value as StructureType)}
            >
              <option value="FLAT">平铺</option>
              <option value="TREE">树形（最多2级）</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>类型说明</span>
            <textarea
              className={textareaClass}
              value={typeFormDesc}
              onChange={(e) => setTypeFormDesc(e.target.value)}
            />
            {typeFormErrors.typeDescription ? (
              <span className="text-xs text-destructive">{typeFormErrors.typeDescription}</span>
            ) : null}
          </label>
          {typeForm?.mode === 'edit' ? (
            <p className="text-muted-foreground">
              是否预置：{typeForm.type.isPreset ? '是' : '否'}
            </p>
          ) : null}
        </div>
      </Modal>

      {/* 类型详情 */}
      <Modal
        open={Boolean(typeDetail)}
        title="字典类型详情"
        confirmLabel="关闭"
        onClose={() => setTypeDetail(null)}
        onConfirm={() => setTypeDetail(null)}
        dataAnno="dictionaries-type-detail"
      >
        {typeDetail ? (
          <div className="space-y-3 text-sm">
            <DetailRow label="类型编码" value={typeDetail.typeCode} />
            <DetailRow label="类型名称" value={typeDetail.typeName} />
            <DetailRow label="结构类型" value={structureTypeLabel(typeDetail.structureType)} />
            <DetailRow label="类型说明" value={displayDash(typeDetail.description)} />
            <DetailRow label="是否预置" value={typeDetail.isPreset ? '是' : '否'} />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">使用状态</span>
              <StatusPill status={typeDetail.status} disabledLabel="禁用" />
            </div>
            <DetailRow
              label="停用原因"
              value={
                typeDetail.status === 'DISABLED' ? displayDash(typeDetail.disableReason) : '-'
              }
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" size="sm" variant="outline" onClick={() => openTypeForm('edit', typeDetail)}>
                编辑
              </Button>
              {typeDetail.status === 'ENABLED' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setTypeDetail(null)
                    openStatusModal({ kind: 'type', target: typeDetail, action: 'disable' })
                  }}
                >
                  禁用
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setTypeDetail(null)
                    openStatusModal({ kind: 'type', target: typeDetail, action: 'enable' })
                  }}
                >
                  启用
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* 项表单 */}
      <Modal
        open={Boolean(itemForm)}
        title={
          itemForm?.mode === 'edit'
            ? '编辑字典项'
            : itemForm?.mode === 'new' && itemForm.level === 2
              ? '新增二级字典项'
              : '新增字典项'
        }
        confirmLabel="保存"
        onClose={closeItemForm}
        onConfirm={saveItemForm}
        dataAnno="dictionaries-item-form"
      >
        {itemForm && selectedType ? (
          <div className="grid gap-3 text-sm">
            <DetailRow label="所属类型编码" value={selectedType.typeCode} />
            <label className="grid gap-1">
              <span>
                项编码 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass}
                value={itemFormCode}
                readOnly={Boolean(itemCodeReadonly)}
                disabled={Boolean(itemCodeReadonly)}
                onChange={(e) => setItemFormCode(e.target.value)}
              />
              {itemFormErrors.itemCode ? (
                <span className="text-xs text-destructive">{itemFormErrors.itemCode}</span>
              ) : null}
            </label>
            <label className="grid gap-1">
              <span>
                项名称 <span className="text-destructive">*</span>
              </span>
              <input
                className={inputClass}
                value={itemFormName}
                onChange={(e) => setItemFormName(e.target.value)}
              />
              {itemFormErrors.itemName ? (
                <span className="text-xs text-destructive">{itemFormErrors.itemName}</span>
              ) : null}
            </label>
            {selectedType.structureType === 'TREE' &&
            (itemForm.mode === 'new' ? itemForm.level === 2 : itemForm.item.level === 2) ? (
              <label className="grid gap-1">
                <span>
                  父项编码 <span className="text-destructive">*</span>
                </span>
                <select
                  className={inputClass}
                  value={itemFormParent}
                  disabled={
                    itemForm.mode === 'edit' &&
                    hasChildItems(selectedType.typeCode, itemForm.item.itemCode)
                  }
                  onChange={(e) => setItemFormParent(e.target.value)}
                >
                  <option value="">请选择</option>
                  {levelOneOptions.map((p) => (
                    <option key={p.id} value={p.itemCode}>
                      {p.itemCode} {p.itemName}
                    </option>
                  ))}
                </select>
                {itemFormErrors.parentItemCode ? (
                  <span className="text-xs text-destructive">{itemFormErrors.parentItemCode}</span>
                ) : null}
              </label>
            ) : null}
            {itemForm.mode === 'edit' ? (
              <>
                <DetailRow label="层级" value={String(itemForm.item.level)} />
                <DetailRow label="是否叶子" value={itemForm.item.isLeaf ? '是' : '否'} />
              </>
            ) : null}
            <label className="grid gap-1">
              <span>排序号</span>
              <input
                type="number"
                className={inputClass}
                min={0}
                max={9999}
                value={itemFormSort}
                onChange={(e) => setItemFormSort(Number(e.target.value))}
              />
              {itemFormErrors.sortOrder ? (
                <span className="text-xs text-destructive">{itemFormErrors.sortOrder}</span>
              ) : null}
            </label>
            <label className="grid gap-1">
              <span>项备注</span>
              <textarea
                className={textareaClass}
                value={itemFormRemark}
                onChange={(e) => setItemFormRemark(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </Modal>

      {/* 项详情 */}
      <Modal
        open={Boolean(itemDetail)}
        title="字典项详情"
        confirmLabel="关闭"
        onClose={() => setItemDetail(null)}
        onConfirm={() => setItemDetail(null)}
        dataAnno="dictionaries-item-detail"
      >
        {itemDetail ? (
          <div className="space-y-2 text-sm">
            <DetailRow label="所属类型编码" value={itemDetail.typeCode} />
            <DetailRow label="项编码" value={itemDetail.itemCode} />
            <DetailRow label="项名称" value={itemDetail.itemName} />
            <DetailRow label="父项编码" value={displayDash(itemDetail.parentItemCode)} />
            <DetailRow label="层级" value={String(itemDetail.level)} />
            <DetailRow label="是否叶子" value={itemDetail.isLeaf ? '是' : '否'} />
            <DetailRow label="排序号" value={String(itemDetail.sortOrder)} />
            <DetailRow label="项备注" value={displayDash(itemDetail.remark)} />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">使用状态</span>
              <StatusPill status={itemDetail.status} disabledLabel="禁用" />
            </div>
            <DetailRow
              label="停用原因"
              value={itemDetail.status === 'DISABLED' ? displayDash(itemDetail.disableReason) : '-'}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const item = itemDetail
                  setItemDetail(null)
                  openItemForm({ mode: 'edit', item })
                }}
              >
                编辑
              </Button>
              {itemDetail.status === 'ENABLED' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setItemDetail(null)
                    openStatusModal({ kind: 'item', target: itemDetail, action: 'disable' })
                  }}
                >
                  禁用
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setItemDetail(null)
                    openStatusModal({ kind: 'item', target: itemDetail, action: 'enable' })
                  }}
                >
                  启用
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* 启停 */}
      <Modal
        open={Boolean(statusModal)}
        title={
          statusModal?.action === 'disable'
            ? statusModal.kind === 'type'
              ? '禁用字典类型'
              : '禁用字典项'
            : '启用确认'
        }
        confirmLabel={statusModal?.action === 'disable' ? '确认禁用' : '确认启用'}
        confirmVariant={statusModal?.action === 'disable' ? 'destructive' : 'default'}
        onClose={closeStatusModal}
        onConfirm={confirmStatusModal}
        dataAnno="dictionaries-status-modal"
      >
        {statusModal?.action === 'disable' ? (
          <label className="grid gap-1 text-sm">
            <span>
              停用原因 <span className="text-destructive">*</span>
            </span>
            <textarea
              className={textareaClass}
              maxLength={200}
              value={disableReason}
              onChange={(e) => {
                setDisableReason(e.target.value)
                if (disableReasonError) setDisableReasonError('')
              }}
            />
            {disableReasonError ? (
              <span className="text-xs text-destructive">{disableReasonError}</span>
            ) : null}
          </label>
        ) : (
          <p className="text-sm text-muted-foreground">确认启用？</p>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  )
}
