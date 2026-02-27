'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Avatar from './Avatar'

// ── Types ────────────────────────────────────────────────────────────────────

type UserPreview = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  followers_count: number
}

// ── Module-level cache ────────────────────────────────────────────────────────

const cache = new Map<string, UserPreview>()
const inflight = new Map<string, Promise<UserPreview | null>>()

async function fetchPreview(username: string): Promise<UserPreview | null> {
  if (cache.has(username)) return cache.get(username)!
  if (inflight.has(username)) return inflight.get(username)!

  const p = (async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, bio')
      .eq('username', username)
      .single()

    if (!profile) return null
    const pid = (profile as { id: string }).id

    const { count } = await supabase
      .from('user_follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', pid)

    const preview: UserPreview = {
      id: pid,
      display_name: (profile as { display_name: string | null }).display_name,
      username: (profile as { username: string | null }).username,
      avatar_url: (profile as { avatar_url: string | null }).avatar_url,
      bio: (profile as { bio: string | null }).bio,
      followers_count: count ?? 0,
    }
    cache.set(username, preview)
    return preview
  })()

  inflight.set(username, p)
  p.finally(() => inflight.delete(username))
  return p
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_W = 320
const GAP = 10

// ── Component ─────────────────────────────────────────────────────────────────

export default function HoverProfileCard({
  username,
  anchorEl,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  username: string
  anchorEl: HTMLElement | null
  onClose: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const [preview, setPreview] = useState<UserPreview | null>(null)
  // Start hidden; useLayoutEffect positions + reveals before paint
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed', visibility: 'hidden', width: CARD_W, zIndex: 9999,
  })
  const [meId, setMeId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [confirmUnfollow, setConfirmUnfollow] = useState(false)
  const [msgLoading, setMsgLoading] = useState(false)
  // Tracks live follow delta so the count updates immediately without a re-fetch
  const [followersDelta, setFollowersDelta] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Reset delta when card reopens for a different user
  useEffect(() => { setFollowersDelta(0) }, [username])

  // ── Positioning (actual rendered height, no flash) ────────────────────────
  useLayoutEffect(() => {
    if (!cardRef.current || !anchorEl) return
    const vh = window.innerHeight
    const vw = window.innerWidth
    const aRect = anchorEl.getBoundingClientRect()
    const cardH = cardRef.current.offsetHeight || 200

    // Open below ONLY when anchor is in the top portion of the viewport.
    // For middle/bottom anchors always prefer opening above.
    const anchorMid = (aRect.top + aRect.bottom) / 2
    const spaceAbove = aRect.top
    const preferBelow = anchorMid < vh * 0.38
    const openBelow = preferBelow && (vh - aRect.bottom) >= cardH + GAP
      || (!preferBelow && spaceAbove < cardH + GAP) // fallback: no room above

    const top = openBelow ? aRect.bottom + GAP : aRect.top - cardH - GAP

    let left = aRect.right - CARD_W
    left = Math.max(GAP, Math.min(left, vw - CARD_W - GAP))

    setStyle({ position: 'fixed', top, left, width: CARD_W, zIndex: 9999, visibility: 'visible' })
  }, [anchorEl, preview]) // rerun when data loads (card grows)

  // ── Data fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    fetchPreview(username).then(d => { if (active) setPreview(d) })
    return () => { active = false }
  }, [username])

  // ── Current user ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null))
  }, [])

  // ── Follow status ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!meId || !preview?.id || meId === preview.id) return
    let active = true
    supabase
      .from('user_follows')
      .select('follower_id')
      .eq('follower_id', meId)
      .eq('following_id', preview.id)
      .maybeSingle()
      .then(({ data }) => { if (active) setIsFollowing(!!data) })
    return () => { active = false }
  }, [meId, preview?.id])

  // ── ESC closes ───────────────────────────────────────────────────────────────
  const stableClose = useCallback(onClose, [onClose]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') stableClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stableClose])

  // ── Click outside closes ─────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) stableClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onDown), 80)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDown) }
  }, [stableClose])

  // ── Follow actions ───────────────────────────────────────────────────────────

  /** Broadcast follow-state change so any FollowButton on the page syncs instantly */
  function broadcastFollow(followingId: string, nowFollowing: boolean) {
    window.dispatchEvent(new CustomEvent('tyuta:follow-change', {
      detail: { followingId, isFollowing: nowFollowing },
    }))
  }

  /** Patch the module-level cache so re-opens show the updated count */
  function patchCacheCount(delta: number) {
    if (cache.has(username)) {
      const c = cache.get(username)!
      cache.set(username, { ...c, followers_count: Math.max(0, c.followers_count + delta) })
    }
  }

  async function doFollow() {
    if (!meId || !preview?.id) return
    setFollowLoading(true)
    await supabase.from('user_follows').insert({ follower_id: meId, following_id: preview.id })
    setIsFollowing(true)
    setFollowLoading(false)
    setFollowersDelta(d => d + 1)
    patchCacheCount(1)
    broadcastFollow(preview.id, true)
  }

  async function doUnfollow() {
    if (!meId || !preview?.id) return
    setFollowLoading(true)
    await supabase.from('user_follows').delete().eq('follower_id', meId).eq('following_id', preview.id)
    setIsFollowing(false)
    setFollowLoading(false)
    setConfirmUnfollow(false)
    setFollowersDelta(d => d - 1)
    patchCacheCount(-1)
    broadcastFollow(preview.id, false)
  }

  async function handleMessage() {
    if (!preview) return
    setMsgLoading(true)
    const { data: convId, error } = await supabase.rpc('start_conversation', { other_user_id: preview.id })
    setMsgLoading(false)
    if (error || !convId) return
    onClose()
    router.push(`/inbox/${convId}`)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const showName = preview?.display_name ?? username
  const profileHref = preview?.username ? `/u/${preview.username}` : `/u/${username}`
  const isOtherUser = !!meId && !!preview?.id && meId !== preview.id
  const shownFollowers = preview !== null ? Math.max(0, preview.followers_count + followersDelta) : null

  // Shared pill style — flex-1 ensures all three buttons have equal width
  const btnBase = [
    'flex-1 h-9 rounded-xl',
    'inline-flex items-center justify-center',
    'text-xs font-semibold select-none',
    'border border-border/50',
    'bg-neutral-100/60 dark:bg-muted/30',
    'text-foreground/75 hover:text-foreground',
    'hover:bg-neutral-200/60 dark:hover:bg-muted/60 hover:border-border/70',
    'cursor-pointer transition-all duration-150 disabled:opacity-50',
  ].join(' ')

  // ── Card JSX ─────────────────────────────────────────────────────────────────
  const card = (
    <div
      ref={cardRef}
      style={style}
      dir="rtl"
      // CRITICAL: stop click propagation so portaled clicks don't bubble to
      // parent role="link" elements (e.g. SidebarPostItem) via React's event tree
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="dialog"
      aria-label={`פרופיל ${showName}`}
      tabIndex={-1}
      className="rounded-2xl border border-border/60 bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl shadow-black/10 dark:shadow-black/40 p-4 focus:outline-none"
    >
      {/* ── Header: avatar (right) + name (text-only click area) + X (far left) ── */}
      <div className="flex items-center gap-2.5 mb-1">
        {/* Avatar — clickable, navigates to profile */}
        <Link href={profileHref} onClick={onClose} className="shrink-0">
          <Avatar src={preview?.avatar_url ?? null} name={showName} size={42} />
        </Link>

        {/* Name — inline so pointer/underline only covers the actual characters */}
        <div className="flex-1 min-w-0">
          <Link
            href={profileHref}
            onClick={onClose}
            className="inline text-sm font-bold leading-tight text-foreground hover:underline break-words"
          >
            {showName}
          </Link>
        </div>

        {/* X close button — always on the physical left (last in RTL flex) */}
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="סגור"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Bio (max 96 chars, 2 lines) ── */}
      {preview?.bio?.trim() ? (
        <p className="mt-2 text-xs leading-[1.6] text-muted-foreground line-clamp-2 break-words">
          {preview.bio.trim().slice(0, 96)}
        </p>
      ) : null}

      {/* ── Followers ── */}
      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" className="shrink-0 opacity-50">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        <span>
          {shownFollowers !== null
            ? shownFollowers.toLocaleString('he-IL')
            : <span className="inline-block w-6 h-3 rounded bg-muted animate-pulse align-middle" />}
          {' '}עוקבים
        </span>
      </div>

      {/* ── Divider ── */}
      <div className="mt-3 border-t border-border/40" />

      {/* ── Bottom action row ── */}
      <div className="mt-3">
        {confirmUnfollow ? (
          /* Inline confirm row */
          <div className="flex items-center gap-2">
            <span className="flex-1 text-xs text-muted-foreground">להסיר מעקב?</span>
            <button type="button" onClick={() => setConfirmUnfollow(false)} className={btnBase}>
              ביטול
            </button>
            <button
              type="button"
              disabled={followLoading}
              onClick={doUnfollow}
              className="flex-1 h-9 rounded-xl inline-flex items-center justify-center text-xs font-semibold select-none cursor-pointer transition-all duration-150 disabled:opacity-50 border border-rose-300/60 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-500/15 hover:border-rose-400/60"
            >
              הסר
            </button>
          </div>
        ) : (
          /* Normal row — equal-width pills: [פרופיל] [עקוב/הסר] [שלח הודעה] */
          <div className="flex items-center gap-2">

            {/* Right (RTL first): פרופיל */}
            <Link href={profileHref} onClick={onClose} className={btnBase}>
              פרופיל
            </Link>

            {/* Middle: follow toggle */}
            {isOtherUser ? (
              <button
                type="button"
                disabled={followLoading}
                onClick={() => isFollowing ? setConfirmUnfollow(true) : doFollow()}
                className={[
                  'group/fw flex-1 h-9 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-semibold select-none cursor-pointer transition-all duration-150 disabled:opacity-50',
                  isFollowing
                    ? 'border border-border/50 bg-neutral-100/60 dark:bg-muted/40 text-foreground/70 hover:border-rose-400/50 dark:hover:border-rose-500/40 hover:bg-rose-50/60 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400'
                    : 'border border-sky-500 bg-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 dark:bg-sky-600 dark:border-sky-600 dark:hover:bg-sky-700 dark:hover:border-sky-700 shadow-sm shadow-sky-500/20',
                ].join(' ')}
              >
                {isFollowing ? (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0 group-hover/fw:hidden" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="group-hover/fw:hidden">עוקב</span>
                    <span className="hidden group-hover/fw:inline">הסר מעקב</span>
                  </>
                ) : 'עקוב'}
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {/* Left (RTL last): שלח הודעה */}
            {isOtherUser ? (
              <button
                type="button"
                onClick={handleMessage}
                disabled={msgLoading}
                className={btnBase}
              >
                {msgLoading ? 'פותח…' : 'שלח הודעה'}
              </button>
            ) : null}

          </div>
        )}
      </div>
    </div>
  )

  return createPortal(card, document.body)
}
