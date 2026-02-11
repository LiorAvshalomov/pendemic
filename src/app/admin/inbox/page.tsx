'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Avatar from '@/components/Avatar'
import { adminFetch } from '@/lib/admin/adminFetch'
import { getAdminErrorMessage } from '@/lib/admin/adminUi'

type UserHit = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

type Thread = {
  conversation_id: string
  other_user_id: string
  other_username: string
  other_display_name: string | null
  other_avatar_url: string | null
  last_body: string | null
  last_created_at: string | null
  unread_count: number
}

type Msg = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

function getSystemUserId(): string | null {
  const v = process.env.NEXT_PUBLIC_SYSTEM_USER_ID
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export default function AdminInboxPage() {
  const systemUserId = getSystemUserId()

  const [q, setQ] = useState('')
  const [userHits, setUserHits] = useState<UserHit[]>([])
  const [searching, setSearching] = useState(false)

  const [threads, setThreads] = useState<Thread[]>([])
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  const [messages, setMessages] = useState<Msg[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)

  const selectedThread = useMemo(
    () => threads.find((t) => t.conversation_id === selectedConversationId) ?? null,
    [threads, selectedConversationId]
  )

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true)
    try {
      const r = await adminFetch('/api/admin/inbox/threads')
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(getAdminErrorMessage(j, 'שגיאה בטעינת שיחות'))
      setThreads(Array.isArray(j?.threads) ? (j.threads as Thread[]) : [])
    } catch (e: any) {
      alert(e?.message ?? 'שגיאה')
      setThreads([])
    } finally {
      setThreadsLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true)
    try {
      const r = await adminFetch(`/api/admin/inbox/messages?conversation_id=${encodeURIComponent(conversationId)}`)
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(getAdminErrorMessage(j, 'שגיאה בטעינת הודעות'))
      setMessages(Array.isArray(j?.messages) ? (j.messages as Msg[]) : [])
      // after fetch, scroll to bottom
      setTimeout(() => {
        const el = listRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
      }, 0)
      // refresh threads (unread counts might have changed)
      void loadThreads()
    } catch (e: any) {
      alert(e?.message ?? 'שגיאה')
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }, [loadThreads])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([])
      return
    }
    void loadMessages(selectedConversationId)
  }, [selectedConversationId, loadMessages])

  const searchUsers = useCallback(async () => {
    const term = q.trim()
    if (term.length < 2) {
      setUserHits([])
      return
    }
    setSearching(true)
    try {
      const r = await adminFetch(`/api/admin/inbox/users?q=${encodeURIComponent(term)}`)
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(getAdminErrorMessage(j, 'שגיאה בחיפוש משתמשים'))
      setUserHits(Array.isArray(j?.users) ? (j.users as UserHit[]) : [])
    } catch (e: any) {
      alert(e?.message ?? 'שגיאה')
      setUserHits([])
    } finally {
      setSearching(false)
    }
  }, [q])

  const startOrOpen = useCallback(async (userId: string) => {
    if (!systemUserId) {
      alert('חסר NEXT_PUBLIC_SYSTEM_USER_ID ב-env')
      return
    }
    try {
      const r = await adminFetch('/api/admin/inbox/thread', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(getAdminErrorMessage(j, 'שגיאה בפתיחת שיחה'))
      const cid = String(j?.conversation_id ?? '')
      if (!cid) throw new Error('שגיאה: חסר conversation_id')
      setSelectedConversationId(cid)
      setQ('')
      setUserHits([])
      void loadThreads()
    } catch (e: any) {
      alert(e?.message ?? 'שגיאה')
    }
  }, [loadThreads, systemUserId])

  const send = useCallback(async () => {
    if (!selectedConversationId) return
    const body = text.trim()
    if (body.length < 1) return
    setSending(true)
    try {
      const r = await adminFetch('/api/admin/inbox/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConversationId, body }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(getAdminErrorMessage(j, 'שגיאה בשליחה'))
      setText('')
      await loadMessages(selectedConversationId)
    } catch (e: any) {
      alert(e?.message ?? 'שגיאה')
    } finally {
      setSending(false)
    }
  }, [loadMessages, selectedConversationId, text])

  const headerName = useMemo(() => {
    if (!selectedThread) return ''
    return (selectedThread.other_display_name ?? '').trim() || (selectedThread.other_username ?? '').trim() || 'שיחה'
  }, [selectedThread])

  return (
    <div className="h-[calc(100dvh-170px)] min-h-0">
      <div className="text-lg font-black">אינבוקס תמיכת מערכת</div>
      <div className="mt-1 text-sm text-muted-foreground">
        חיפוש משתמשים · פתיחת שיחה · היסטוריה · שליחת הודעות כ"מערכת האתר".
      </div>

      <div className="mt-4 grid h-[calc(100%-64px)] min-h-0 gap-4 md:grid-cols-[360px_1fr]">
        {/* Left: threads + user search */}
        <aside className="min-h-0 overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-sm">
          <div className="border-b border-black/5 bg-white/70 p-3">
            <div className="text-sm font-black">פתח/י שיחה</div>
            <div className="mt-2 flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void searchUsers()
                }}
                placeholder="חפש username / שם תצוגה…"
                className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => void searchUsers()}
                className="shrink-0 rounded-2xl bg-black px-3 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                חפש
              </button>
            </div>
            {searching ? <div className="mt-2 text-xs text-muted-foreground">מחפש…</div> : null}

            {userHits.length > 0 ? (
              <div className="mt-3 space-y-2">
                {userHits.map((u) => {
                  const name = (u.display_name ?? '').trim() || (u.username ?? '').trim()
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => void startOrOpen(u.id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white px-3 py-2 text-right hover:bg-neutral-50"
                    >
                      <Avatar src={u.avatar_url} name={name} size={36} shape="square" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black">{name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">@{u.username}</div>
                      </div>
                      <span className="text-xs font-bold text-neutral-600">פתח</span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-black">שיחות</div>
              <button
                type="button"
                onClick={() => void loadThreads()}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold hover:bg-neutral-50"
              >
                רענן
              </button>
            </div>
            {threadsLoading ? (
              <div className="rounded-2xl border bg-white p-3 text-sm text-muted-foreground">טוען…</div>
            ) : threads.length === 0 ? (
              <div className="rounded-2xl border bg-white p-3 text-sm text-muted-foreground">אין שיחות עדיין.</div>
            ) : (
              <div className="space-y-2">
                {threads.map((t) => {
                  const name =
                    (t.other_display_name ?? '').trim() || (t.other_username ?? '').trim() || 'שיחה'
                  const active = t.conversation_id === selectedConversationId
                  const unread = Number.isFinite(t.unread_count) ? t.unread_count : 0
                  const hasUnread = unread > 0
                  const lastBody = (t.last_body ?? '').trim() || 'אין עדיין הודעות'

                  return (
                    <button
                      key={t.conversation_id}
                      type="button"
                      onClick={() => setSelectedConversationId(t.conversation_id)}
                      className={
                        'w-full rounded-2xl border p-3 text-right transition ' +
                        (active
                          ? 'bg-white border-neutral-300 ring-1 ring-neutral-300'
                          : 'bg-white border-black/5 hover:bg-neutral-50')
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={t.other_avatar_url} name={name} size={40} shape="square" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-black">{name}</div>
                            {hasUnread ? (
                              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-white">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 truncate text-xs text-muted-foreground">{lastBody}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right: chat */}
        <section className="min-h-0 overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-sm">
          {!selectedConversationId ? (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <div className="text-lg font-black">בחר שיחה</div>
                <div className="mt-1 text-sm text-muted-foreground">או חפש משתמש כדי לפתוח שיחה חדשה</div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <div className="border-b border-black/5 bg-white/70 px-4 py-3">
                <div className="text-sm font-black truncate">{headerName}</div>
                <div className="text-[11px] text-muted-foreground">{selectedThread?.other_username ? `@${selectedThread.other_username}` : ''}</div>
              </div>

              <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-4" style={{ backgroundColor: '#FBFAF8' }}>
                {messagesLoading ? (
                  <div className="rounded-2xl border bg-white p-3 text-sm text-muted-foreground">טוען הודעות…</div>
                ) : messages.length === 0 ? (
                  <div className="rounded-2xl border bg-white p-3 text-sm text-muted-foreground">אין עדיין הודעות.</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const isMine = systemUserId ? m.sender_id === systemUserId : false
                      return (
                        <div key={m.id} className={isMine ? 'flex justify-start' : 'flex justify-end'}>
                          <div
                            className={
                              'max-w-[85%] rounded-2xl border px-3 py-2 text-sm shadow-sm whitespace-pre-wrap ' +
                              (isMine ? 'bg-white border-black/10' : 'bg-black text-white border-black')
                            }
                          >
                            <div>{m.body}</div>
                            <div className={isMine ? 'mt-1 text-[10px] text-muted-foreground' : 'mt-1 text-[10px] text-white/70'}>
                              {formatDay(m.created_at)} · {formatTime(m.created_at)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-black/5 bg-white/70 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    placeholder="כתוב הודעה…"
                    className="w-full resize-none rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none"
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault()
                        void send()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={sending || text.trim().length === 0}
                    className={
                      'shrink-0 rounded-2xl px-4 py-3 text-sm font-black text-white ' +
                      (sending || text.trim().length === 0 ? 'bg-black/30 cursor-not-allowed' : 'bg-black hover:opacity-90')
                    }
                  >
                    שלח
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-muted-foreground">
                  שליחה כ"מערכת האתר" (System User). קיצור: Ctrl/⌘ + Enter.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
