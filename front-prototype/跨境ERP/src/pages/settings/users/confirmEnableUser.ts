import { Message, Modal } from '@arco-design/web-react'
import { listUsers, nowString, saveUsers } from '@/features/settings/storage'

export function confirmEnableUser(account: string, onDone?: () => void) {
  Modal.confirm({
    title: '启用用户',
    content: '确认启用该账号？',
    okText: '启用',
    onOk: () => {
      const users = listUsers().map((u) =>
        u.用户账号 === account
          ? { ...u, 启停用状态: 'ENABLED' as const, 最后修改时间: nowString() }
          : u,
      )
      saveUsers(users)
      Message.success('已启用')
      onDone?.()
    },
  })
}
