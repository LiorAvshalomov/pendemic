'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Search } from 'lucide-react'
import Avatar from '@/components/Avatar'
import { adminFetch } from '@/lib/admin/adminFetch'
import { getAdminErrorMessage } from '@/lib/admin/adminUi'
import ErrorBanner from './ErrorBanner'
import EmptyState from './EmptyState'
import { TableSkeleton } from './AdminSkeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

type PostSnapshot = {
  title: string | null
  slug: string | null
  author_id: string | null
  channel_id: string | null
  status: string | null
  published_at: string | null
  is_anonymous: boolean | null
  created_at: string | null
}

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type DeletionEvent = {
  id: string
  created_at: string
  action: 'soft_delete' | 'admin_soft_hide' | 'hard_delete' | 'admin_hard_delete'
  actor_kind: 'user' | 'admin' | 'system'
  actor_user_id: string | null
  target_post_id: string
  post_snapshot: PostSnapshot
  reason: string | null
  actor_profile: Profile | null
  author_profile: Profile | null
}

type Filters = {
  action: string
  actor_kind: string
  q: string
  from: string
  to: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

const ACTION_CONFIG: Record<string, { label: string; className: string }> = {
  soft_delete:       { label: 'מחיקה עצמית (זמנית)',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  admin_soft_hide:   { label: 'הסתרה (אדמין)',           className: 'bg-orange-50 text-orange-700 border-orange-200' },
  hard_delete:       { label: 'מחיקה קבועה (משתמש)',    className: 'bg-red-50 text-red-600 border-red-200' },
  admin_hard_delete: { label: 'מחיקה קבועה (אדמין)',    className: 'bg-red-100 text-red-800 border-red-300' },
}

const IS_HARD = (action: string) =>
  action === 'hard_delete' || action === 'admin_hard_delete'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function profileName(p: Profile | null, fallbackId?: string | null): string {
  if (!p) return fallbackId ? fallbackId.slice(0, 8) + '…' : '—'
  return p.display_name || (p.username ? `@${p.username}` : p.id.slice(0, 8) + '…')
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, className: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function ProfileCell({ profile, userId }: { profile: Profile | null; userId: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Avatar src={profile?.avatar_url} name={profileName(profile, userId)} size={20} />
      <span className="truncate text-xs text-neutral-700">{profileName(profile, userId)}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeletionHistoryTab() {
  const [filters, setFilters] = useState<Filters>({ action: '', actor_kind: '', q: '', from: '', to: '' })
  const [draftQ, setDraftQ]   = useState('')

  const [events,  setEvents]  = useState<DeletionEvent[]>([])
  const [total,   setTotal]   = useState(0)
  const [offset,  setOffset]  = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [err,     setErr]     = useState<string | null>(null)

  const load = useCallback(async (currentOffset: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true)
    setErr(null)

    try {
      const params = new URLSearchParams({
        limit:  String(PAGE_SIZE),
        offset: String(currentOffset),
      })
      if (filters.action)     params.set('action',     filters.action)
      if (filters.actor_kind) params.set('actor_kind', filters.actor_kind)
      if (filters.q)          params.set('q',          filters.q)
      if (filters.from)       params.set('from',        filters.from)
      if (filters.to)         params.set('to',          filters.to)

      const r = await adminFetch(`/api/admin/posts/history?${params}`)
      const j: unknown = await r.json()
      if (!r.ok) throw new Error(getAdminErrorMessage(j, 'שגיאה'))

      const data = j && typeof j === 'object' ? (j as Record<string, unknown>) : {}
      const newEvents = Array.isArray(data.events) ? (data.events as DeletionEvent[]) : []
      const newTotal  = typeof data.total === 'number' ? data.total : 0

      setEvents(prev => append ? [...prev, ...newEvents] : newEvents)
      setTotal(newTotal)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters])

  // Reset + reload when filters change
  useEffect(() => {
    setOffset(0)
    setEvents([])
    load(0, false)
  }, [load])

  function applySearch() {
    setFilters(f => ({ ...f, q: draftQ.trim() }))
  }

  function handleLoadMore() {
    const next = offset + PAGE_SIZE
    setOffset(next)
    load(next, true)
  }

  const hasMore = events.length < total

  return (
    <div dir="rtl" className="space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        {/* Action */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">פעולה</label>
          <select
            value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
          >
            <option value="">הכל</option>
            <option value="soft_delete">מחיקה עצמית (זמנית)</option>
            <option value="admin_soft_hide">הסתרה (אדמין)</option>
            <option value="hard_delete">מחיקה קבועה (משתמש)</option>
            <option value="admin_hard_delete">מחיקה קבועה (אדמין)</option>
          </select>
        </div>

        {/* Actor kind */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">מבצע</label>
          <select
            value={filters.actor_kind}
            onChange={e => setFilters(f => ({ ...f, actor_kind: e.target.value }))}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
          >
            <option value="">הכל</option>
            <option value="user">משתמש</option>
            <option value="admin">אדמין</option>
            <option value="system">מערכת</option>
          </select>
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">מתאריך</label>
          <input
            type="date"
            value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">עד תאריך</label>
          <input
            type="date"
            value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        {/* Text search */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">כותרת / slug</label>
          <div className="flex gap-1">
            <div className="relative">
              <Search size={13} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-neutral-400" />
              <input
                value={draftQ}
                onChange={e => setDraftQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applySearch()}
                placeholder="חפש…"
                className="w-[160px] rounded-lg border border-neutral-200 bg-white py-1.5 pr-7 pl-3 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            <button
              type="button"
              onClick={applySearch}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              חפש
            </button>
          </div>
        </div>

        {/* Clear */}
        {(filters.action || filters.actor_kind || filters.q || filters.from || filters.to) && (
          <button
            type="button"
            onClick={() => { setFilters({ action: '', actor_kind: '', q: '', from: '', to: '' }); setDraftQ('') }}
            className="self-end rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-50"
          >
            נקה
          </button>
        )}
      </div>

      {/* ── Count ── */}
      {!loading && !err && (
        <p className="text-xs text-neutral-400">
          {total === 0 ? 'אין אירועים' : `${total.toLocaleString('he-IL')} אירועים בסה״כ`}
          {events.length > 0 && events.length < total ? ` · מוצגים ${events.length}` : ''}
        </p>
      )}

      {/* ── States ── */}
      {err && <ErrorBanner message={err} onRetry={() => load(0, false)} />}
      {loading && <TableSkeleton rows={6} />}

      {!loading && !err && events.length === 0 && (
        <EmptyState title="אין היסטוריית מחיקות" icon={<Clock size={36} strokeWidth={1.5} />} />
      )}

      {/* ── Events list ── */}
      {!loading && events.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {/* Desktop table header */}
          <div className="hidden grid-cols-[160px_180px_1fr_160px_160px] gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-500 sm:grid">
            <span>זמן</span>
            <span>פעולה</span>
            <span>פוסט</span>
            <span>מחק / הסתיר</span>
            <span>מחבר הפוסט</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {events.map((ev) => {
              const snap     = ev.post_snapshot
              const isHard   = IS_HARD(ev.action)
              const postTitle = snap.title || '(ללא כותרת)'
              const postSlug  = snap.slug

              return (
                <div
                  key={ev.id}
                  className="grid grid-cols-1 gap-2 px-4 py-3 text-sm transition-colors hover:bg-neutral-50 sm:grid-cols-[160px_180px_1fr_160px_160px] sm:items-center sm:gap-3"
                >
                  {/* Time */}
                  <div className="text-xs text-neutral-500">{fmtDateTime(ev.created_at)}</div>

                  {/* Action badge */}
                  <div>
                    <ActionBadge action={ev.action} />
                  </div>

                  {/* Post title + slug */}
                  <div className="min-w-0">
                    {isHard ? (
                      <span className="font-medium text-neutral-700">{postTitle}</span>
                    ) : postSlug ? (
                      <a
                        href={`/post/${postSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {postTitle}
                      </a>
                    ) : (
                      <span className="font-medium text-neutral-700">{postTitle}</span>
                    )}
                    {postSlug && (
                      <div className="mt-0.5 font-mono text-xs text-neutral-400">{postSlug}</div>
                    )}
                    {ev.reason && (
                      <div className="mt-1 rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-500 border border-neutral-100">
                        סיבה: {ev.reason}
                      </div>
                    )}
                  </div>

                  {/* Actor */}
                  <ProfileCell profile={ev.actor_profile} userId={ev.actor_user_id} />

                  {/* Post author */}
                  <ProfileCell profile={ev.author_profile} userId={snap.author_id} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Load more ── */}
      {!loading && hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-lg border border-neutral-200 bg-white px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {loadingMore ? 'טוען…' : 'טען עוד'}
          </button>
        </div>
      )}
    </div>
  )
}
