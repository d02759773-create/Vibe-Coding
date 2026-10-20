import { Card, Grid, List, Typography } from '@arco-design/web-react'
import { Link } from 'react-router-dom'

const todoItems = [
  { title: '补货建议待采纳', path: '/purchase/replenish-suggestion' },
  { title: '采购需求待审核', path: '/purchase/demand' },
  { title: '委外派单待确认', path: '/purchase/dispatch' },
  { title: '采购收货通知单待仓储审核', path: '/purchase/receiving-notice' },
  { title: '收货 / 质检 / 上架待处理', path: '/warehouse/receiving' },
  { title: 'FBA 发货计划与改仓改箱审批', path: '/fba/shipment-plan' },
  { title: '委外加工费账单', path: '/finance/garment-processing-bill' },
]

const { Row, Col } = Grid

export function WorkbenchPage() {
  return (
    <div>
      <Typography.Title heading={4} style={{ marginTop: 0 }}>
        首页
      </Typography.Title>
      <Typography.Paragraph style={{ color: 'var(--color-text-3)' }}>
        腾达科技跨境电商 ERP 一期框架。左侧为《06》全量一级业务域与二级页面菜单；演示壳层，不含登录与权限。
      </Typography.Paragraph>
      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="待办汇总（示意）" size="small">
            <List
              size="small"
              dataSource={todoItems}
              render={(item) => (
                <List.Item key={item.path}>
                  <Link to={item.path}>{item.title}</Link>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="一期范围提示" size="small">
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              Amazon 美国站 · 国内单仓 · PLM/BOM · 委外成衣采购 · FBA 备货 · 平台订单与售后。
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              外部供应商菜单见侧栏「供应商协同（外部）」，与内部员工同一系统、按角色显隐（正式环境由权限控制）。
            </Typography.Text>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
