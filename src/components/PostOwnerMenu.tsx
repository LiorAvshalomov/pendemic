"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

function getErrorMessage(e: unknown) {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message
  }
  if (e instanceof Error) return e.message
  return 'שגיאה לא ידועה'
}

async function authedFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  }
  if (init.body && !headers['Content-Type'] && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(input, { ...init, headers })
}

export default function PostOwnerMenu({
  postId,
  authorId,
  postSlug,
  returnUrl,
}: {
  postId: string
  authorId: string
  postSlug?: string
  returnUrl?: string
}) {
  const [viewerId, setViewerId] = useState<string | null>(null)
  const isOwner = useMemo(() => viewerId === authorId, [viewerId, authorId])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setViewerId(data.user?.id ?? null)).catch(() => setViewerId(null))
  }, [])

  const onDelete = async () => {
    const ok = confirm('למחוק את הפוסט? אפשר יהיה לשחזר עד 14 יום, ואז יימחק לצמיתות.')
    if (!ok) return

    try {
      const res = await authedFetch(`/api/posts/${postId}/delete`, { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error?.message ?? j?.error ?? 'שגיאה במחיקה')
      // simplest: return to profile/home
      window.location.href = '/'
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    }
  }

  const safeReturn = useMemo(() => {
    if (returnUrl && returnUrl.startsWith('/')) return returnUrl
    if (typeof window !== 'undefined') {
      const path = window.location.pathname + window.location.search
      if (path.startsWith('/')) return path
    }
    if (postSlug) return `/post/${postSlug}`
    return null
  }, [returnUrl, postSlug])

  if (!isOwner) return null

  return (
    <div className="relative" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border bg-white px-2 py-1 text-xs shadow-sm hover:bg-neutral-50"
        aria-haspopup="menu"
        aria-expanded={open}
        title="פעולות"
      >
        ⋯
      </button>

      {open ? (
        <div className="absolute left-0 mt-2 w-40 overflow-hidden rounded border bg-white text-sm shadow-lg">
          <Link
            href={`/write?edit=${encodeURIComponent(postId)}${safeReturn ? `&return=${encodeURIComponent(safeReturn)}` : ''}`}
            className="block px-3 py-2 hover:bg-neutral-50"
            onClick={() => setOpen(false)}
          >
            ערוך
          </Link>
          <button
            type="button"
            className="block w-full px-3 py-2 text-right text-red-700 hover:bg-red-50"
            onClick={() => {
              setOpen(false)
              void onDelete()
            }}
          >
            מחק
          </button>
        </div>
      ) : null}
    </div>
  )
}
