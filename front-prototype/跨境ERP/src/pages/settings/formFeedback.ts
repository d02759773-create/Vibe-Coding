import { message } from 'antd'

/** 与 context/跨境电商ERP/12 一致 */
export const FORM_VALIDATE_TOAST = '请完善标红字段后再保存'

export function toastFormValidateFailed() {
  message.warning(FORM_VALIDATE_TOAST)
}

export function toastSaveSuccess(isNew: boolean) {
  message.success(isNew ? '新增成功' : '保存成功')
}
