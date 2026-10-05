import { Input } from 'antd'
import { Modal } from '@/components/Modal'

type EnableDisableModalProps = {
  open: boolean
  mode: 'enable' | 'disable'
  entityLabel: string
  disableReason: string
  disableReasonError: string
  maxReasonLength?: number
  enableHint?: string
  dataAnno?: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function EnableDisableModal({
  open,
  mode,
  entityLabel,
  disableReason,
  disableReasonError,
  maxReasonLength = 200,
  enableHint,
  dataAnno,
  onReasonChange,
  onClose,
  onConfirm,
}: EnableDisableModalProps) {
  return (
    <Modal
      dataAnno={dataAnno}
      open={open}
      title={mode === 'disable' ? `确认停用${entityLabel}？` : `确认启用${entityLabel}？`}
      confirmLabel={mode === 'disable' ? '确认停用' : '确认启用'}
      confirmVariant={mode === 'disable' ? 'destructive' : 'default'}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {mode === 'disable' ? (
        <>
          <p>
            停用原因 <span style={{ color: 'var(--ant-color-error)' }}>*</span>
          </p>
          <Input.TextArea
            rows={4}
            maxLength={maxReasonLength}
            value={disableReason}
            status={disableReasonError ? 'error' : undefined}
            onChange={(e) => onReasonChange(e.target.value)}
          />
          {disableReasonError ? (
            <p style={{ color: 'var(--ant-color-error)', fontSize: 12 }}>{disableReasonError}</p>
          ) : null}
        </>
      ) : (
        <p>{enableHint ?? '启用后可再次被业务单据引用。'}</p>
      )}
    </Modal>
  )
}
