import { Message } from '@arco-design/web-react'

/** 与 context/跨境电商ERP/12 一致 */
export const FORM_VALIDATE_TOAST = '请完善标红字段后再保存'

export function toastFormValidateFailed() {
  Message.warning(FORM_VALIDATE_TOAST)
}

export function toastSaveSuccess(isNew: boolean) {
  Message.success(isNew ? '新增成功' : '保存成功')
}
