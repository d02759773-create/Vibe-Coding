import { Modal } from '@arco-design/web-react'

const TITLE = '放弃未保存的修改？'
const CONTENT = '当前有未保存的变更，离开后将丢失。'

/** 有未保存变更时二次确认再执行跳转（Demo 新增 §2.3 [P2]） */
export function confirmUnsavedNavigate(isDirty: boolean, navigate: () => void) {
  if (!isDirty) {
    navigate()
    return
  }
  Modal.confirm({
    title: TITLE,
    content: CONTENT,
    okText: '离开',
    cancelText: '继续编辑',
    onOk: navigate,
  })
}
