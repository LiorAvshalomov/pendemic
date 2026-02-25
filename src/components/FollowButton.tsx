'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function FollowButton({
  targetUserId,
  variant = 'default',
}: {
  targetUserId: string
  targetUsername?: string
  variant?: 'default' | 'text'
}) {
  const [myId, setMyId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data } = await supabase.auth.getUser()
      const uid = data?.user?.id ?? null
      if (!mounted) return
      setMyId(uid)

      if (!uid || uid === targetUserId) {
        setLoading(false)
        return
      }

      const { data: row } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', uid)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (!mounted) return
      setIsFollowing(!!row)
      setLoading(false)
    }

    init()

    return () => { mounted = false }
  }, [targetUserId])

  async function doUnfollow() {
    if (!myId) return
    setLoading(true)
    await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', myId)
      .eq('following_id', targetUserId)
    setIsFollowing(false)
    setLoading(false)
    setConfirmOpen(false)
  }

  async function doFollow() {
    if (!myId) return
    setLoading(true)
    await supabase.from('user_follows').insert({
      follower_id: myId,
      following_id: targetUserId,
    })
    setIsFollowing(true)
    setLoading(false)
  }

  function handleClick() {
    if (!myId || myId === targetUserId) return
    if (isFollowing) {
      setConfirmOpen(true)
      return
    }
    doFollow()
  }

  // לא מציגים כפתור בפרופיל שלי / לא מחובר
  if (!myId || myId === targetUserId) return null

  const confirmDialog = confirmOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setConfirmOpen(false)}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-white dark:bg-card p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <p className="text-base font-bold text-neutral-900 dark:text-foreground">להסיר מעקב?</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          את/ה בטוח/ה שתרצה/י להפסיק לעקוב אחרי הכותב?
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted/50"
          >
            ביטול
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={doUnfollow}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            הסר מעקב
          </button>
        </div>
      </div>
    </div>
  ) : null

  if (variant === 'text') {
    return (
      <>
        {confirmDialog}
        <button
          type="button"
          disabled={loading}
          onClick={handleClick}
          className={[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition cursor-pointer',
            isFollowing
              ? 'bg-neutral-100 text-neutral-600 hover:bg-red-500/10 hover:text-red-500 dark:bg-muted dark:text-muted-foreground dark:hover:bg-red-500/10 dark:hover:text-red-400'
              : 'bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20',
            loading ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isFollowing ? 'הסר מעקב' : 'עקוב'}
        </button>
      </>
    )
  }

  // default variant
  const base =
    'h-10 min-w-[110px] rounded-full px-4 text-sm font-semibold transition inline-flex items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]'

  return (
    <>
      {confirmDialog}
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className={[
          base,
          isFollowing
            ? 'border bg-white hover:bg-neutral-50 text-black dark:bg-card dark:border-border dark:hover:bg-muted dark:text-foreground'
            : '!bg-black !text-white hover:!bg-black/90 hover:!text-white',
          loading ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {isFollowing ? 'הסר מעקב' : 'עקוב'}
      </button>
    </>
  )
}
