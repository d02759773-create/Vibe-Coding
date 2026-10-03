import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function HomePage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>欢迎使用进销存管理系统</CardTitle>
          <CardDescription>
            当前为前端原型框架，后续将基于本地 Mock 数据逐步完善各业务模块。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          请从左侧导航进入销售、采购、库存或基础资料模块。尚未实现的页面将显示统一占位提示。
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>原型范围</CardTitle>
          <CardDescription>本阶段仅搭建系统外壳与路由骨架</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          不包含真实接口、登录权限、业务表格与单据字段。销售订单相关路由已预留列表、详情、新增与编辑路径。
        </CardContent>
      </Card>
    </div>
  )
}
