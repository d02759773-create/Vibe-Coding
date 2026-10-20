import {
  Button,
  DatePicker,
  Form,
  Grid,
  Input,
  Select,
  Skeleton,
  Space,
  Table,
} from '@arco-design/web-react'
import type { ColumnProps } from '@arco-design/web-react/es/Table'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

export type SettingsListTableAction = {
  reload: () => void
}

export type SettingsSearchField =
  | {
      name: string
      label: string
      type: 'text'
      hidden?: boolean
    }
  | {
      name: string
      label: string
      type: 'select'
      options: { label: string; value: string }[]
      hidden?: boolean
    }
  | {
      name: string
      label: string
      type: 'dateTimeRange'
      hidden?: boolean
    }

type RequestResult<T> = { data: T[]; success: boolean; total: number }

type SettingsListTableProps<T extends object> = {
  rowKey: keyof T & string
  columns: ColumnProps<T>[]
  searchFields: SettingsSearchField[]
  searchClassName?: string
  defaultSearchCollapsed?: boolean
  toolbar?: ReactNode
  emptyNode: ReactNode
  tableBodyAnno?: string
  actionRef?: React.RefObject<SettingsListTableAction | null>
  request: (params: Record<string, unknown>) => Promise<RequestResult<T>>
}

const { Row, Col } = Grid
const { RangePicker } = DatePicker

function formValueToParams(
  fields: SettingsSearchField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of fields) {
    const v = values[field.name]
    if (field.type === 'dateTimeRange') {
      if (Array.isArray(v) && v.length === 2 && v[0] && v[1]) {
        out[field.name] = [
          (v[0] as { format?: (f: string) => string }).format?.('YYYY-MM-DD HH:mm:ss') ??
            String(v[0]),
          (v[1] as { format?: (f: string) => string }).format?.('YYYY-MM-DD HH:mm:ss') ??
            String(v[1]),
        ]
      }
      continue
    }
    if (v !== undefined && v !== null && v !== '') {
      out[field.name] = v
    }
  }
  return out
}

export function SettingsListTable<T extends object>({
  rowKey,
  columns,
  searchFields,
  searchClassName,
  defaultSearchCollapsed = true,
  toolbar,
  emptyNode,
  tableBodyAnno,
  actionRef,
  request,
}: SettingsListTableProps<T>) {
  const [form] = Form.useForm()
  const [collapsed, setCollapsed] = useState(defaultSearchCollapsed)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<T[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const paramsRef = useRef<Record<string, unknown>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await request(paramsRef.current)
      if (result.success) {
        setData(result.data)
        setPagination((p) => ({ ...p, total: result.total }))
      }
    } finally {
      setLoading(false)
    }
  }, [request])

  useImperativeHandle(actionRef, () => ({
    reload: () => {
      void fetchData()
    },
  }))

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const visibleFields = collapsed
    ? searchFields.filter((f) => !f.hidden).slice(0, 4)
    : searchFields.filter((f) => !f.hidden)

  const onSearch = () => {
    const values = form.getFieldsValue()
    paramsRef.current = formValueToParams(searchFields, values)
    setPagination((p) => ({ ...p, current: 1 }))
    void fetchData()
  }

  const onReset = () => {
    form.resetFields()
    paramsRef.current = {}
    setPagination((p) => ({ ...p, current: 1 }))
    void fetchData()
  }

  const pagedData = data.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize,
  )

  return (
    <div>
      {searchFields.length > 0 && (
        <div className={searchClassName} style={{ marginBottom: 16, padding: 16, background: '#fff' }}>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              {visibleFields.map((field) => (
                <Col key={field.name} xs={24} sm={12} md={8} lg={6}>
                  <Form.Item label={field.label} field={field.name}>
                    {field.type === 'text' && <Input allowClear />}
                    {field.type === 'select' && (
                      <Select allowClear options={field.options} showSearch />
                    )}
                    {field.type === 'dateTimeRange' && (
                      <RangePicker showTime style={{ width: '100%' }} />
                    )}
                  </Form.Item>
                </Col>
              ))}
            </Row>
            <Space>
              <Button type="primary" onClick={onSearch}>查询</Button>
              <Button onClick={onReset}>重置</Button>
              {searchFields.filter((f) => !f.hidden).length > 4 && (
                <Button type="text" onClick={() => setCollapsed((c) => !c)}>
                  {collapsed ? '展开' : '收起'}
                </Button>
              )}
            </Space>
          </Form>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>{toolbar}</div>

      {loading ? (
        <div style={{ padding: 24, background: '#fff' }}>
          <Skeleton animation text={{ rows: 12, width: ['100%'] }} />
        </div>
      ) : (
        <div data-anno={tableBodyAnno}>
          <Table<T>
            rowKey={rowKey}
            columns={columns}
            data={pagedData}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              sizeCanChange: true,
              pageSizeChangeResetCurrent: true,
              sizeOptions: [20, 50, 100],
              onChange: (current, pageSize) => {
                setPagination({ current, pageSize, total: pagination.total })
              },
            }}
            scroll={{ x: true }}
            noDataElement={emptyNode}
          />
        </div>
      )}
    </div>
  )
}
