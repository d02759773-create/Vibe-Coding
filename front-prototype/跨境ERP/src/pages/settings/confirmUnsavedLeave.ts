import { Modal } from 'antd'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'

const TITLE = '放弃未保存的修改？'
const CONTENT = '当前有未保存的变更，离开后将丢失。'

type ConfirmModal = Pick<ModalStaticFunctions, 'confirm'>

/** 有未保存变更时二次确认再执行跳转（Demo 新增 §2.3 [P2]） */
export function confirmUnsavedNavigate(
  isDirty: boolean,
  navigate: () => void,
  modalApi?: ConfirmModal,
) {
  if (!isDirty) {
    navigate()
    return
  }
  const modal = modalApi ?? Modal
  modal.confirm({
    title: TITLE,
    content: CONTENT,
    okText: '离开',
    cancelText: '继续编辑',
    zIndex: 2147483640,
    onOk: navigate,
  })
}
