export type AuthBroadcastEventType = 'SIGNED_OUT' | 'TOKEN_REFRESH_FAILED'

const AUTH_EVENT_KEY = 'pendemic:auth:event'
const AUTH_STATE_KEY = 'pendemic:auth:state'

type AuthBroadcastPayload = {
  type: AuthBroadcastEventType
  ts: number
}

export function setAuthState(state: 'in' | 'out'): void {
  try {
    localStorage.setItem(AUTH_STATE_KEY, state)
  } catch {
    // ignore (Safari private mode, etc.)
  }
}

export function getAuthState(): 'in' | 'out' | null {
  try {
    const v = localStorage.getItem(AUTH_STATE_KEY)
    return v === 'in' || v === 'out' ? v : null
  } catch {
    return null
  }
}

export function broadcastAuthEvent(type: AuthBroadcastEventType): void {
  const payload: AuthBroadcastPayload = { type, ts: Date.now() }
  try {
    localStorage.setItem(AUTH_EVENT_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function parseAuthBroadcastEvent(raw: string | null): AuthBroadcastPayload | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return null
    const rec = v as Record<string, unknown>
    const type = rec.type
    const ts = rec.ts
    if ((type === 'SIGNED_OUT' || type === 'TOKEN_REFRESH_FAILED') && typeof ts === 'number') {
      return { type, ts }
    }
    return null
  } catch {
    return null
  }
}

export const AUTH_BROADCAST_STORAGE_KEY = AUTH_EVENT_KEY
