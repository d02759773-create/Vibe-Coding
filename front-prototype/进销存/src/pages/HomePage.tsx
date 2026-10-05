import { Card, Col, Row, Typography } from 'antd'

export function HomePage() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card title="欢迎使用进销存管理系统">
          <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
            当前为前端原型框架，后续将基于本地 Mock 数据逐步完善各业务模块。
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            请从左侧导航进入销售、采购、库存或基础资料模块。销售/采购订单与基础资料档案已可演示，其余子模块仍为占位页。
          </Typography.Text>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="原型范围">
          <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
            本阶段仅搭建系统外壳与路由骨架
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            数据存于浏览器 localStorage，不含真实接口与权限。销售订单与采购订单共用同一套列表/表单交互范式。
          </Typography.Text>
        </Card>
      </Col>
    </Row>
  )
}
