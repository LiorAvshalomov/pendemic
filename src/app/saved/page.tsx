'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type SavedPostRow = {
  id: string
  created_at: string
  post: {
    id: string
    slug: string
    title: string | null
    excerpt: string | null
    author_username: string | null
    author_display_name: string | null
    channel_name: string | null
    published_at: string | null
  } | null
}

function clampText(s: string | null | undefined, max: number) {
  const t = (s ?? '').trim()
  if (!t) return ''
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t
}

export default function SavedPostsPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<SavedPostRow[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setErr(null)

        const { data: u } = await supabase.auth.getUser()
        if (!u.user) {
          if (alive) {
            setRows([])
            setErr('כדי לראות פוסטים שמורים צריך להתחבר.')
            setLoading(false)
          }
          return
        }

        const { data, error } = await supabase
          .from('post_bookmarks')
          .select(
            'id, created_at, post:posts(id, slug, title, excerpt, author_username, author_display_name, channel_name, published_at)'
          )
          .order('created_at', { ascending: false })

        if (error) throw error
        if (alive) setRows((data ?? []) as SavedPostRow[])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'שגיאה לא ידועה'
        if (alive) setErr(msg)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-neutral-50" dir="rtl">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h1 className="text-2xl font-black tracking-tight text-neutral-950">פוסטים שמורים</h1>
          <p className="mt-1 text-sm text-neutral-600">הפוסטים ששמרת לקריאה מאוחרת.</p>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 text-sm text-neutral-600">טוען…</div>
          ) : rows.length === 0 ? (
            <div className="mt-6 text-sm text-neutral-600">אין פוסטים שמורים עדיין.</div>
          ) : (
            <div className="mt-6 space-y-3">
              {rows.map((r) => {
                const p = r.post
                if (!p) return null
                return (
                  <Link
                    key={r.id}
                    href={`/post/${p.slug}`}
                    className="block rounded-2xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
                  >
                    <div className="text-[15px] font-extrabold text-neutral-950">
                      {clampText(p.title ?? 'ללא כותרת', 60)}
                    </div>
                    {p.excerpt ? (
                      <div className="mt-1 text-sm text-neutral-600">{clampText(p.excerpt, 90)}</div>
                    ) : null}
                    <div className="mt-2 text-xs text-neutral-500">
                      {p.author_display_name ?? p.author_username ?? ''}
                      {p.channel_name ? ` · ${p.channel_name}` : ''}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
