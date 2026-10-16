import type { EnableStatus, MenuVisibility, RoleCode } from '@/features/settings/constants'

export type UserRoleAssignment = {
  角色编码: RoleCode
}

export type InternalUser = {
  用户账号: string
  用户姓名: string
  手机号: string
  邮箱: string
  启停用状态: EnableStatus
  停用原因: string
  用户备注: string
  最后登录时间: string
  角色明细: UserRoleAssignment[]
  创建人: string
  创建时间: string
  最后修改人: string
  最后修改时间: string
}

export type RoleRecord = {
  角色编码: RoleCode
  角色名称: string
  启停用状态: EnableStatus
  角色说明: string
  创建人: string
  创建时间: string
  最后修改人: string
  最后修改时间: string
}

export type RoleMenuPermission = {
  二级菜单编码: string
  菜单可见性: MenuVisibility
}
