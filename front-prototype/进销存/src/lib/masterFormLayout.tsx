import { Card, Col, Row } from 'antd'
import type { ColProps } from 'antd'
import type { ReactNode } from 'react'
import { Children } from 'react'

/** 主数据表单：大屏固定 3 列、中屏 2 列、小屏 1 列 */
export const masterFormColProps: ColProps = { xs: 24, sm: 12, lg: 8 }

export const masterFormRowGutter: [number, number] = [16, 0]

/** 占满一行（备注、地址等） */
export const masterFormColFull: ColProps = { xs: 24, sm: 24, lg: 24 }

/** Select / 日期等：与 Input 同宽 */
export const masterFormControlProps = { style: { width: '100%' as const } }

type MasterFormSectionProps = {
  title: ReactNode
  children: ReactNode
  'data-anno'?: string
}

/** Card + Row：字段用 MasterFormCol 包裹，保证列对齐（不用 ProForm.Group） */
export function MasterFormSection({ title, children, 'data-anno': dataAnno }: MasterFormSectionProps) {
  return (
    <Card title={title} size="small" style={{ marginBottom: 16 }} data-anno={dataAnno}>
      <Row gutter={masterFormRowGutter} align="top">
        {children}
      </Row>
    </Card>
  )
}

type MasterFormColProps = {
  children: ReactNode
  colProps?: ColProps
}

export function MasterFormCol({ children, colProps = masterFormColProps }: MasterFormColProps) {
  return <Col {...colProps}>{children}</Col>
}

/** @deprecated 使用 MasterFormSection + MasterFormCol */
export function MasterFormGroup(props: MasterFormSectionProps) {
  return <MasterFormSection {...props} />
}

/** 详情区块：固定 3 列栅格 */
export const masterDetailColumn = { xs: 1, sm: 2, lg: 3 } as const

export const masterDetailColProps: ColProps = { xs: 24, sm: 12, lg: 8 }

export function MasterDetailGrid({ children }: { children: ReactNode }) {
  return (
    <Row gutter={[24, 0]} align="top">
      {Children.map(children, (child, index) => (
        <Col key={index} {...masterDetailColProps}>
          {child}
        </Col>
      ))}
    </Row>
  )
}
