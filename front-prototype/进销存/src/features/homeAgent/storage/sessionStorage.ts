import type { ChatMessage, DatasetRef, PendingClarify, PendingConfirm } from '../types'

const SESSIONS_KEY = 'inventory.homeAgent.sessions.v1'
const ACTIVE_KEY = 'inventory.homeAgent.activeSessionId'

export type AgentSession = {
  id: string
  title: string
  messages: ChatMessage[]
  datasets: DatasetRef[]
  pendingClarify?: PendingClarify | null
  pendingConfirm?: PendingConfirm | null
  createdAt: number
  updatedAt: number
}

export type SessionStoreV1 = {
  version: 1
  sessions: AgentSession[]
}

function newSessionId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptySession(): AgentSession {
  const now = Date.now()
  return {
    id: newSessionId(),
    title: '新会话',
    messages: [],
    datasets: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function deriveSessionTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser?.content.trim()) return '新会话'
  const t = firstUser.content.trim().replace(/\s+/g, ' ')
  return t.length > 36 ? `${t.slice(0, 36)}…` : t
}

export function loadSessionStore(): SessionStoreV1 {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return { version: 1, sessions: [] }
    const parsed = JSON.parse(raw) as SessionStoreV1
    if (parsed.version !== 1 || !Array.isArray(parsed.sessions)) {
      return { version: 1, sessions: [] }
    }
    return parsed
  } catch {
    return { version: 1, sessions: [] }
  }
}

export function saveSessionStore(store: SessionStoreV1): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(store))
}

export function loadActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function saveActiveSessionId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function upsertSessionInStore(session: AgentSession): SessionStoreV1 {
  const store = loadSessionStore()
  const idx = store.sessions.findIndex((s) => s.id === session.id)
  if (idx >= 0) store.sessions[idx] = session
  else store.sessions.unshift(session)
  store.sessions.sort((a, b) => b.updatedAt - a.updatedAt)
  saveSessionStore(store)
  return store
}

export function deleteSessionFromStore(id: string): SessionStoreV1 {
  const store = loadSessionStore()
  store.sessions = store.sessions.filter((s) => s.id !== id)
  saveSessionStore(store)
  return store
}

export function initSessions(): { sessions: AgentSession[]; activeId: string } {
  let store = loadSessionStore()
  let activeId = loadActiveSessionId()

  if (store.sessions.length === 0) {
    const s = createEmptySession()
    store = { version: 1, sessions: [s] }
    saveSessionStore(store)
    activeId = s.id
    saveActiveSessionId(activeId)
  }

  if (!activeId || !store.sessions.some((s) => s.id === activeId)) {
    activeId = store.sessions[0].id
    saveActiveSessionId(activeId)
  }

  return { sessions: store.sessions, activeId }
}
