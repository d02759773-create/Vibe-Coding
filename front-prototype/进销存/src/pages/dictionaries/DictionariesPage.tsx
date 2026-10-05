import { useMemo, useState, type ReactNode } from 'react'
import type { ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Card, Col, Input, InputNumber, Row, Select, Space, Typography, Button as AntButton } from 'antd'
import { Button } from '@/components/ui/button'
import { TableRowActions, tableActionLinkStyle } from '@/components/table/TableRowActions'
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

  const typeColumns: ProColumns<DictionaryType>[] = useMemo(
    () => [
      {
        title: '类型',
        dataIndex: 'typeName',
        render: (_, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{row.typeName}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
              {row.typeCode}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {structureTypeLabel(row.structureType)}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 88,
        render: (_, row) => <StatusPill status={row.status} disabledLabel="禁用" />,
      },
      {
        title: '操作',
        valueType: 'option',
        width: 160,
        render: (_, row) => (
          <TableRowActions
            items={[
              <AntButton
                key="view"
                type="link"
                size="small"
                style={tableActionLinkStyle}
                onClick={(e) => {
                  e.stopPropagation()
                  setTypeDetail(row)
                }}
              >
                查看
              </AntButton>,
              <AntButton
                key="edit"
                type="link"
                size="small"
                style={tableActionLinkStyle}
                onClick={(e) => {
                  e.stopPropagation()
                  openTypeForm('edit', row)
                }}
              >
                编辑
              </AntButton>,
              row.status === 'ENABLED' ? (
                <AntButton
                  key="disable"
                  type="link"
                  size="small"
                  danger
                  style={tableActionLinkStyle}
                  onClick={(e) => {
                    e.stopPropagation()
                    openStatusModal({ kind: 'type', target: row, action: 'disable' })
                  }}
                >
                  禁用
                </AntButton>
              ) : (
                <AntButton
                  key="enable"
                  type="link"
                  size="small"
                  style={tableActionLinkStyle}
                  onClick={(e) => {
                    e.stopPropagation()
                    openStatusModal({ kind: 'type', target: row, action: 'enable' })
                  }}
                >
                  启用
                </AntButton>
              ),
            ]}
          />
        ),
      },
    ],
    [],
  )

  const itemColumns: ProColumns<DictionaryItem>[] = useMemo(() => {
    const isTree = selectedType?.structureType === 'TREE'
    const treeCols: ProColumns<DictionaryItem>[] = isTree
      ? [
          {
            title: '项名称',
            dataIndex: 'itemName',
            render: (_, row) => (
              <span style={{ paddingLeft: row.level === 2 ? 24 : 0 }}>{row.itemName}</span>
            ),
          },
          { title: '项编码', dataIndex: 'itemCode', render: (v) => <Typography.Text code>{v}</Typography.Text> },
          { title: '层级', dataIndex: 'level', width: 64 },
          {
            title: '是否叶子',
            dataIndex: 'isLeaf',
            width: 88,
            render: (_, row) => (row.isLeaf ? '是' : '否'),
          },
        ]
      : [
          { title: '项编码', dataIndex: 'itemCode', render: (v) => <Typography.Text code>{v}</Typography.Text> },
          { title: '项名称', dataIndex: 'itemName' },
        ]

    return [
      ...treeCols,
      { title: '排序号', dataIndex: 'sortOrder', width: 80 },
      {
        title: '使用状态',
        dataIndex: 'status',
        width: 96,
        render: (_, row) => <StatusPill status={row.status} disabledLabel="禁用" />,
      },
      {
        title: '最后修改时间',
        dataIndex: 'updatedAt',
        width: 168,
        render: (_, row) => (
          <Typography.Text type="secondary">{formatDateTime(row.updatedAt)}</Typography.Text>
        ),
      },
      {
        title: '操作',
        valueType: 'option',
        width: 200,
        fixed: 'right',
        render: (_, row) => (
          <TableRowActions
            items={[
              <AntButton
                key="view"
                type="link"
                size="small"
                style={tableActionLinkStyle}
                onClick={() => setItemDetail(row)}
              >
                查看
              </AntButton>,
              <AntButton
                key="edit"
                type="link"
                size="small"
                style={tableActionLinkStyle}
                onClick={() => openItemForm({ mode: 'edit', item: row })}
              >
                编辑
              </AntButton>,
              row.status === 'ENABLED' ? (
                <AntButton
                  key="disable"
                  type="link"
                  size="small"
                  danger
                  style={tableActionLinkStyle}
                  onClick={() => openStatusModal({ kind: 'item', target: row, action: 'disable' })}
                >
                  禁用
                </AntButton>
              ) : (
                <AntButton
                  key="enable"
                  type="link"
                  size="small"
                  style={tableActionLinkStyle}
                  onClick={() => openStatusModal({ kind: 'item', target: row, action: 'enable' })}
                >
                  启用
                </AntButton>
              ),
            ]}
          />
        ),
      },
    ]
  }, [selectedType?.structureType])

  return (
    <PageContainer
      title="数据字典"
      subTitle="维护字典类型与字典项，供档案与单据引用"
      data-anno="dictionaries-page"
    >
      <Row gutter={16} align="top" data-anno="dictionaries-toolbar">
        <Col xs={24} lg={8} xl={7}>
          <Card
            title="字典类型"
            size="small"
            data-anno="dictionaries-type-panel"
            extra={
              <Button type="button" size="sm" onClick={() => openTypeForm('new')}>
                新增类型
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Input
                value={typeFilters.typeName}
                onChange={(e) => setTypeFilters((f) => ({ ...f, typeName: e.target.value }))}
                placeholder="类型名称"
                allowClear
              />
              <Input
                value={typeFilters.typeCode}
                onChange={(e) => setTypeFilters((f) => ({ ...f, typeCode: e.target.value }))}
                placeholder="类型编码"
                allowClear
              />
              <Row gutter={8}>
                <Col span={12}>
                  <Select
                    style={{ width: '100%' }}
                    value={typeFilters.structureType || undefined}
                    onChange={(v) =>
                      setTypeFilters((f) => ({
                        ...f,
                        structureType: (v ?? '') as DictionaryTypeFilters['structureType'],
                      }))
                    }
                    options={STRUCTURE_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    allowClear
                    placeholder="结构类型"
                  />
                </Col>
                <Col span={12}>
                  <Select
                    style={{ width: '100%' }}
                    value={typeFilters.status || undefined}
                    onChange={(v) =>
                      setTypeFilters((f) => ({
                        ...f,
                        status: (v ?? '') as DictionaryTypeFilters['status'],
                      }))
                    }
                    options={STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    allowClear
                    placeholder="使用状态"
                  />
                </Col>
              </Row>
              <Space>
                <Button type="button" variant="outline" size="sm" onClick={handleTypeReset}>
                  重置
                </Button>
                <Button type="button" size="sm" onClick={handleTypeSearch}>
                  搜索
                </Button>
              </Space>
              <ProTable<DictionaryType>
                rowKey="id"
                dataSource={types}
                columns={typeColumns}
                search={false}
                options={false}
                pagination={false}
                scroll={{ y: 420 }}
                size="small"
                data-anno="dictionaries-type-table"
                onRow={(record) => ({
                  onClick: () => setSelectedTypeCode(record.typeCode),
                  style: { cursor: 'pointer' },
                })}
                rowClassName={(record) =>
                  record.typeCode === selectedTypeCode ? 'ant-table-row-selected' : ''
                }
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16} xl={17}>
          <Card size="small" data-anno="dictionaries-item-panel">
            {!selectedType ? (
              <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 48 }}>
                请先在左侧选择字典类型
              </Typography.Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row justify="space-between" align="middle" gutter={[8, 8]}>
                  <Col>
                    <Space direction="vertical" size={4}>
                      <Typography.Text strong style={{ fontSize: 16 }}>
                        {selectedType.typeName}{' '}
                        <Typography.Text type="secondary" code style={{ fontWeight: 400 }}>
                          {selectedType.typeCode}
                        </Typography.Text>
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {structureTypeLabel(selectedType.structureType)}
                      </Typography.Text>
                    </Space>
                  </Col>
                  <Col>
                    <Space wrap>
                      {selectedType.structureType === 'TREE' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openItemForm({ mode: 'new', level: 1 })}
                          >
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
                    </Space>
                  </Col>
                </Row>
                <Row gutter={8}>
                  <Col xs={24} md={8}>
                    <Input
                      value={itemFilters.itemCode}
                      onChange={(e) => setItemFilters((f) => ({ ...f, itemCode: e.target.value }))}
                      placeholder="项编码"
                      allowClear
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Input
                      value={itemFilters.itemName}
                      onChange={(e) => setItemFilters((f) => ({ ...f, itemName: e.target.value }))}
                      placeholder="项名称"
                      allowClear
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Select
                      style={{ width: '100%' }}
                      value={itemFilters.status || undefined}
                      onChange={(v) =>
                        setItemFilters((f) => ({
                          ...f,
                          status: (v ?? '') as DictionaryItemFilters['status'],
                        }))
                      }
                      options={STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      allowClear
                      placeholder="使用状态"
                    />
                  </Col>
                </Row>
                <Space>
                  <Button type="button" variant="outline" size="sm" onClick={handleItemReset}>
                    重置
                  </Button>
                  <Button type="button" size="sm" onClick={handleItemSearch}>
                    搜索
                  </Button>
                </Space>
                <ProTable<DictionaryItem>
                  rowKey="id"
                  dataSource={items}
                  columns={itemColumns}
                  search={false}
                  options={false}
                  pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
                  scroll={{ x: 720 }}
                  size="small"
                  data-anno="dictionaries-item-table"
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* 类型表单 */}
      <Modal
        open={Boolean(typeForm)}
        title={typeForm?.mode === 'edit' ? '编辑字典类型' : '新增字典类型'}
        confirmLabel="保存"
        onClose={closeTypeForm}
        onConfirm={saveTypeForm}
        dataAnno="dictionaries-type-form"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <FormField label="类型编码" required error={typeFormErrors.typeCode}>
            <Input
              value={typeFormCode}
              readOnly={typeForm?.mode === 'edit'}
              disabled={typeForm?.mode === 'edit'}
              onChange={(e) => setTypeFormCode(e.target.value.toUpperCase())}
              placeholder="RETURN_REASON"
            />
          </FormField>
          <FormField label="类型名称" required error={typeFormErrors.typeName}>
            <Input value={typeFormName} onChange={(e) => setTypeFormName(e.target.value)} />
          </FormField>
          <FormField label="结构类型" required>
            <Select
              style={{ width: '100%' }}
              value={typeFormStructure}
              disabled={typeForm?.mode === 'edit'}
              onChange={(v) => setTypeFormStructure(v as StructureType)}
              options={[
                { value: 'FLAT', label: '平铺' },
                { value: 'TREE', label: '树形（最多2级）' },
              ]}
            />
          </FormField>
          <FormField label="类型说明" error={typeFormErrors.typeDescription}>
            <Input.TextArea value={typeFormDesc} onChange={(e) => setTypeFormDesc(e.target.value)} rows={3} />
          </FormField>
          {typeForm?.mode === 'edit' ? (
            <Typography.Text type="secondary">
              是否预置：{typeForm.type.isPreset ? '是' : '否'}
            </Typography.Text>
          ) : null}
        </Space>
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
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <DetailRow label="类型编码" value={typeDetail.typeCode} />
            <DetailRow label="类型名称" value={typeDetail.typeName} />
            <DetailRow label="结构类型" value={structureTypeLabel(typeDetail.structureType)} />
            <DetailRow label="类型说明" value={displayDash(typeDetail.description)} />
            <DetailRow label="是否预置" value={typeDetail.isPreset ? '是' : '否'} />
            <Space align="center">
              <Typography.Text type="secondary">使用状态</Typography.Text>
              <StatusPill status={typeDetail.status} disabledLabel="禁用" />
            </Space>
            <DetailRow
              label="停用原因"
              value={
                typeDetail.status === 'DISABLED' ? displayDash(typeDetail.disableReason) : '-'
              }
            />
            <Space wrap>
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
            </Space>
          </Space>
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
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <DetailRow label="所属类型编码" value={selectedType.typeCode} />
            <FormField label="项编码" required error={itemFormErrors.itemCode}>
              <Input
                value={itemFormCode}
                readOnly={Boolean(itemCodeReadonly)}
                disabled={Boolean(itemCodeReadonly)}
                onChange={(e) => setItemFormCode(e.target.value)}
              />
            </FormField>
            <FormField label="项名称" required error={itemFormErrors.itemName}>
              <Input value={itemFormName} onChange={(e) => setItemFormName(e.target.value)} />
            </FormField>
            {selectedType.structureType === 'TREE' &&
            (itemForm.mode === 'new' ? itemForm.level === 2 : itemForm.item.level === 2) ? (
              <FormField label="父项编码" required error={itemFormErrors.parentItemCode}>
                <Select
                  style={{ width: '100%' }}
                  value={itemFormParent || undefined}
                  disabled={
                    itemForm.mode === 'edit' &&
                    hasChildItems(selectedType.typeCode, itemForm.item.itemCode)
                  }
                  onChange={(v) => setItemFormParent(v ?? '')}
                  placeholder="请选择"
                  options={levelOneOptions.map((p) => ({
                    value: p.itemCode,
                    label: `${p.itemCode} ${p.itemName}`,
                  }))}
                />
              </FormField>
            ) : null}
            {itemForm.mode === 'edit' ? (
              <>
                <DetailRow label="层级" value={String(itemForm.item.level)} />
                <DetailRow label="是否叶子" value={itemForm.item.isLeaf ? '是' : '否'} />
              </>
            ) : null}
            <FormField label="排序号" error={itemFormErrors.sortOrder}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={9999}
                value={itemFormSort}
                onChange={(v) => setItemFormSort(Number(v ?? 0))}
              />
            </FormField>
            <FormField label="项备注">
              <Input.TextArea value={itemFormRemark} onChange={(e) => setItemFormRemark(e.target.value)} rows={3} />
            </FormField>
          </Space>
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
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <DetailRow label="所属类型编码" value={itemDetail.typeCode} />
            <DetailRow label="项编码" value={itemDetail.itemCode} />
            <DetailRow label="项名称" value={itemDetail.itemName} />
            <DetailRow label="父项编码" value={displayDash(itemDetail.parentItemCode)} />
            <DetailRow label="层级" value={String(itemDetail.level)} />
            <DetailRow label="是否叶子" value={itemDetail.isLeaf ? '是' : '否'} />
            <DetailRow label="排序号" value={String(itemDetail.sortOrder)} />
            <DetailRow label="项备注" value={displayDash(itemDetail.remark)} />
            <Space align="center">
              <Typography.Text type="secondary">使用状态</Typography.Text>
              <StatusPill status={itemDetail.status} disabledLabel="禁用" />
            </Space>
            <DetailRow
              label="停用原因"
              value={itemDetail.status === 'DISABLED' ? displayDash(itemDetail.disableReason) : '-'}
            />
            <Space wrap>
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
            </Space>
          </Space>
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
          <FormField label="停用原因" required error={disableReasonError}>
            <Input.TextArea
              maxLength={200}
              rows={3}
              value={disableReason}
              onChange={(e) => {
                setDisableReason(e.target.value)
                if (disableReasonError) setDisableReasonError('')
              }}
            />
          </FormField>
        ) : (
          <Typography.Text type="secondary">确认启用？</Typography.Text>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Text>
        {label}
        {required ? <Typography.Text type="danger"> *</Typography.Text> : null}
      </Typography.Text>
      {children}
      {error ? (
        <Typography.Text type="danger" style={{ fontSize: 12 }}>
          {error}
        </Typography.Text>
      ) : null}
    </Space>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Row gutter={8} wrap={false}>
      <Col flex="120px">
        <Typography.Text type="secondary">{label}</Typography.Text>
      </Col>
      <Col flex="auto">
        <Typography.Text style={{ wordBreak: 'break-all' }}>{value}</Typography.Text>
      </Col>
    </Row>
  )
}
