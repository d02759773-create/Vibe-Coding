import { Alert, Button, Flex, Spin, Tag } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enrichClarifyAnswers } from '../agent/enrichClarifyAnswers'
import { recoverPendingClarify, recoverPendingConfirm } from '../agent/sanitizeMessagesForLlm'
import { resumeAfterClarify, resumeAfterToolInteraction, runAgentTurn } from '../agent/runAgentTurn'
import { loadAgentConfig, saveAgentConfig } from '../storage/agentConfigStorage'
import {
  createEmptySession,
  deleteSessionFromStore,
  deriveSessionTitle,
  initSessions,
  saveActiveSessionId,
  upsertSessionInStore,
  type AgentSession,
} from '../storage/sessionStorage'
import { applyConfirmedAction } from '../tools/applyConfirmedAction'
import type {
  ChatMessage,
  DatasetRef,
  HomeAgentConfigV1,
  PendingClarify,
  PendingConfirm,
} from '../types'
import { AgentComposer } from './AgentComposer'
import { AgentSessionSidebar } from './AgentSessionSidebar'
import { AgentSettingsDrawer } from './AgentSettingsDrawer'
import { ClarifyCard } from './ClarifyCard'
import { ConfirmActionModal } from './ConfirmActionModal'
import { MessageContent } from './MessageContent'
import '../homeAgent.css'

export function HomeAgentPage() {
  const navigate = useNavigate()
  const initial = useMemo(() => initSessions(), [])
  const initialSession = initial.sessions.find((x) => x.id === initial.activeId)
  const [config, setConfig] = useState<HomeAgentConfigV1>(() => loadAgentConfig())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sessions, setSessions] = useState<AgentSession[]>(initial.sessions)
  const [activeId, setActiveId] = useState(initial.activeId)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const s = initial.sessions.find((x) => x.id === initial.activeId)
    return s?.messages ?? []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datasets, setDatasets] = useState<DatasetRef[]>(() => {
    const s = initial.sessions.find((x) => x.id === initial.activeId)
    return s?.datasets ?? []
  })
  const [pendingClarify, setPendingClarify] = useState<PendingClarify | null>(
    () =>
      initialSession?.pendingClarify ??
      (initialSession ? recoverPendingClarify(initialSession.messages) : null),
  )
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    () =>
      initialSession?.pendingConfirm ??
      (initialSession ? recoverPendingConfirm(initialSession.messages) : null),
  )
  const abortRef = useRef<AbortController | null>(null)
  const listEndRef = useRef<HTMLDivElement>(null)
  const skipPersistRef = useRef(false)

  const onConfigChange = (next: HomeAgentConfigV1) => {
    setConfig(next)
    saveAgentConfig(next)
  }

  const toolContext = useMemo(
    () => ({
      datasets,
      navigate: (path: string, query?: Record<string, string>) => {
        const search = query ? `?${new URLSearchParams(query).toString()}` : ''
        navigate(`${path}${search}`)
      },
    }),
    [datasets, navigate],
  )

  const scrollToEnd = () => {
    requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }
    const prev = sessions.find((s) => s.id === activeId)
    const updated: AgentSession = {
      id: activeId,
      title: deriveSessionTitle(messages),
      messages,
      datasets,
      pendingClarify,
      pendingConfirm,
      createdAt: prev?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }
    const store = upsertSessionInStore(updated)
    setSessions(store.sessions)
  }, [activeId, messages, datasets, pendingClarify, pendingConfirm])

  const loadSessionIntoUi = (session: AgentSession) => {
    skipPersistRef.current = true
    setMessages(session.messages)
    setDatasets(session.datasets)
    setPendingClarify(
      session.pendingClarify ?? recoverPendingClarify(session.messages),
    )
    setPendingConfirm(
      session.pendingConfirm ?? recoverPendingConfirm(session.messages),
    )
    setError(null)
    setInput('')
  }

  const selectSession = (id: string) => {
    if (id === activeId) return
    abortRef.current?.abort()
    setLoading(false)
    const session = sessions.find((s) => s.id === id)
    if (!session) return
    setActiveId(id)
    saveActiveSessionId(id)
    loadSessionIntoUi(session)
  }

  const startNewSession = () => {
    abortRef.current?.abort()
    setLoading(false)
    const session = createEmptySession()
    const store = upsertSessionInStore(session)
    setSessions(store.sessions)
    setActiveId(session.id)
    saveActiveSessionId(session.id)
    loadSessionIntoUi(session)
  }

  const removeSession = (id: string) => {
    const store = deleteSessionFromStore(id)
    setSessions(store.sessions)
    if (id !== activeId) return
    if (store.sessions.length === 0) {
      startNewSession()
      return
    }
    const next = store.sessions[0]
    setActiveId(next.id)
    saveActiveSessionId(next.id)
    loadSessionIntoUi(next)
  }

  const handleOutcome = useCallback((outcome: Awaited<ReturnType<typeof runAgentTurn>>) => {
    setMessages(outcome.messages)
    if (outcome.status === 'clarify') {
      setPendingClarify(outcome.pending)
      setPendingConfirm(null)
      setError(null)
    } else if (outcome.status === 'confirm') {
      setPendingConfirm(outcome.pending)
      setPendingClarify(null)
      setError(null)
    } else if (outcome.status === 'error') {
      setError(outcome.error)
      setPendingClarify(null)
      setPendingConfirm(null)
    } else {
      setError(null)
      setPendingClarify(null)
      setPendingConfirm(null)
    }
    scrollToEnd()
  }, [])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (pendingClarify) {
      setError('请先完成上方的补充信息确认，再发送新消息。')
      return
    }
    if (pendingConfirm) {
      setError('请先处理上方的操作确认弹窗。')
      return
    }
    setInput('')
    setLoading(true)
    setError(null)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const outcome = await runAgentTurn({
      config,
      messages,
      userText: text,
      toolContext,
      signal: abortRef.current.signal,
      onMessagesUpdate: (m) => {
        setMessages(m)
        scrollToEnd()
      },
    })
    setLoading(false)
    handleOutcome(outcome)
  }

  const submitClarify = async (answers: Record<string, unknown>) => {
    if (!pendingClarify) return
    setLoading(true)
    const outcome = await resumeAfterClarify({
      config,
      messages,
      toolCallId: pendingClarify.toolCallId,
      answers: enrichClarifyAnswers(answers),
      timedOut: false,
      toolContext,
      onMessagesUpdate: setMessages,
    })
    setLoading(false)
    handleOutcome(outcome)
  }

  const clarifyTimeout = () => {
    if (!pendingClarify) return
    void (async () => {
      setLoading(true)
      const outcome = await resumeAfterClarify({
        config,
        messages,
        toolCallId: pendingClarify.toolCallId,
        answers: {},
        timedOut: true,
        toolContext,
        onMessagesUpdate: setMessages,
      })
      setLoading(false)
      handleOutcome(outcome)
    })()
  }

  const finishConfirm = async (confirmed: boolean) => {
    if (!pendingConfirm) return
    const { toolCallId, payload } = pendingConfirm
    setPendingConfirm(null)
    setLoading(true)

    let toolContent: string
    if (confirmed) {
      const result = applyConfirmedAction(payload)
      toolContent = JSON.stringify({ confirmed: true, ...result })
      if (result.ok && result.orderId) {
        navigate(`/purchase/orders/${result.orderId}`)
      }
    } else {
      toolContent = JSON.stringify({ confirmed: false, reason: 'user_cancelled' })
    }

    const outcome = await resumeAfterToolInteraction({
      config,
      messages,
      toolCallId,
      toolContent,
      toolContext,
      onMessagesUpdate: (m) => {
        setMessages(m)
        scrollToEnd()
      },
    })
    setLoading(false)
    handleOutcome(outcome)
  }

  const visibleMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant')
  const streamingReply =
    loading && visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1]?.role === 'assistant'
  const isEmpty = visibleMessages.length === 0

  return (
    <div className="codex-workbench hermes-workbench">
      <div className="hermes-body">
        <AgentSessionSidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={selectSession}
          onNew={startNewSession}
          onDelete={removeSession}
        />

        <div className="hermes-main">
          <header className="hermes-toolbar">
            <span className="hermes-toolbar-title">
              {deriveSessionTitle(messages)}
            </span>
            <div className="hermes-toolbar-right">
              <Button type="text" icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
                设置
              </Button>
            </div>
          </header>

          <div className="hermes-stage">
            {error && (
              <div className="hermes-error">
                <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />
              </div>
            )}

            {isEmpty ? (
              <div className="hermes-hero">
                <div className="hermes-hero-watermark" aria-hidden>AI</div>
                <h1 className="hermes-hero-title">AI 工作台</h1>
                <p className="hermes-hero-sub">
                  查数据、做分析、操作进销存。说明你的目标，机械性步骤交给 AI；指令不清时会先向您确认。
                </p>
              </div>
            ) : (
              <div className="codex-thread hermes-thread">
                {visibleMessages.map((m) => (
                  <div key={m.id} className={`codex-message codex-message--${m.role}`}>
                    <div className="codex-message-role">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                    <div className="codex-message-body">
                      <MessageContent content={m.content} isAssistant={m.role === 'assistant'} />
                      {streamingReply && m.id === visibleMessages[visibleMessages.length - 1]?.id && (
                        <span className="codex-cursor">▍</span>
                      )}
                    </div>
                  </div>
                ))}
                {pendingClarify && (
                  <ClarifyCard
                    payload={pendingClarify.payload}
                    timeoutMs={config.clarifyTimeoutMs}
                    onSubmit={submitClarify}
                    onTimeout={clarifyTimeout}
                  />
                )}
                {loading && !streamingReply && (
                  <Flex justify="center" style={{ padding: 16 }}>
                    <Spin size="small" tip="思考中…" />
                  </Flex>
                )}
                <div ref={listEndRef} />
              </div>
            )}
          </div>

          {datasets.length > 0 && (
            <div className="hermes-context-files">
              {datasets.map((d) => (
                <Tag
                  key={d.id}
                  closable
                  onClose={() => setDatasets((prev) => prev.filter((x) => x.id !== d.id))}
                >
                  {d.name} · {d.rowCount} 行
                </Tag>
              ))}
            </div>
          )}

          <AgentComposer
            value={input}
            onChange={setInput}
            onSend={() => void sendMessage()}
            loading={loading}
            onDatasetAdd={(ds) => setDatasets((prev) => [...prev, ds])}
            config={config}
            onConfigChange={onConfigChange}
          />
        </div>
      </div>

      <AgentSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onChange={onConfigChange}
      />

      <ConfirmActionModal
        open={Boolean(pendingConfirm)}
        payload={pendingConfirm?.payload ?? null}
        onConfirm={() => void finishConfirm(true)}
        onCancel={() => void finishConfirm(false)}
      />
    </div>
  )
}
