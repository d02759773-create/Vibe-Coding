import { Modal } from 'antd'
import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

const TITLE = '放弃未保存的修改？'
const CONTENT = '当前有未保存的变更，离开后将丢失。'

/** 侧栏 / 浏览器返回等同路由离开时弹出确认；保存成功跳转前须调用 `allowLeaveOnce()` */
export function useUnsavedLeaveBlocker(when: boolean) {
  const skipRef = useRef(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when &&
      !skipRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    Modal.confirm({
      title: TITLE,
      content: CONTENT,
      okText: '离开',
      cancelText: '继续编辑',
      zIndex: 2147483640,
      onOk: () => {
        skipRef.current = true
        blocker.proceed()
      },
      onCancel: () => blocker.reset(),
    })
  }, [blocker])

  const allowLeaveOnce = () => {
    skipRef.current = true
  }

  return { allowLeaveOnce }
}
