"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import PostCard, { type PostCardPost } from '@/components/PostCard'
import { supabase } from '@/lib/supabaseClient'

type SortKey = 'recent' | 'reactions' | 'comments'

type PostBase = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  created_at: string
  cover_image_url: string | null
  channel?: { name_he: string }[] | null
}

type PostRow = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  created_at: string
  cover_image_url: string | null
  channel?: { name_he: string }[] | null
}

function clampPage(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

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

export default function ProfilePostsClient({
  profileId,
  username,
  perPage = 5,
}: {
  profileId: string
  username: string
  perPage?: number
}) {
  const [viewerId, setViewerId] = useState<string | null>(null)
  const isOwner = viewerId === profileId

  const [sort, setSort] = useState<SortKey>('recent')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<PostCardPost[]>([])
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  // cached sorted ids for non-recent sorts (so changing page doesn't refetch everything)
  const [sortedIdsCache, setSortedIdsCache] = useState<Record<string, string[]>>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setViewerId(data.user?.id ?? null)).catch(() => setViewerId(null))
  }, [])

  const totalPages = useMemo(() => {
    const pages = Math.max(1, Math.ceil(total / perPage))
    return pages
  }, [total, perPage])

  useEffect(() => {
    // reset pagination when changing sort
    setPage(1)
  }, [sort])

  const refetchHard = () => {
    setSortedIdsCache({})
    setRefreshKey((k) => k + 1)
  }

  const onDelete = async (post: PostCardPost) => {
    if (!post.id) return
    const ok = confirm('למחוק את הפוסט? אפשר יהיה לשחזר עד 14 יום, ואז יימחק לצמיתות.')
    if (!ok) return

    try {
      const res = await authedFetch(`/api/posts/${post.id}/delete`, { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error?.message ?? j?.error ?? 'שגיאה במחיקה')

      // remove from UI immediately
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
      refetchHard()
    } catch (e: unknown) {
      alert(getErrorMessage(e))
    }
  }

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      const safePage = clampPage(page)
      const from = (safePage - 1) * perPage
      const to = from + perPage - 1

      try {
        // Total count
        const countRes = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', profileId)
          .eq('status', 'published')
          .is('deleted_at', null)

        if (countRes.error) throw countRes.error
        const totalCount = countRes.count ?? 0
        if (!cancelled) setTotal(totalCount)

        // RECENT
        if (sort === 'recent') {
          const res = await supabase
            .from('posts')
            .select(
              `id, slug, title, excerpt, created_at, cover_image_url,
              channel:channels ( name_he )`
            )
            .eq('author_id', profileId)
            .eq('status', 'published')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(from, to)

          if (res.error) throw res.error

          const mapped = (res.data ?? []).map((p: PostBase) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            created_at: p.created_at,
            cover_image_url: p.cover_image_url,
            channel_name: p.channel?.[0]?.name_he ?? null,
            author_name: username,
            author_username: username,
            tags: [],
            medals: null,
          })) as PostCardPost[]

          if (!cancelled) setPosts(mapped)
          return
        }

        // REACTIONS / COMMENTS
        const cacheKey = `${sort}:${profileId}`
        let sortedIds = sortedIdsCache[cacheKey]

        if (!sortedIds) {
          const allPostsRes = await supabase
            .from('posts')
            .select('id, slug, title, excerpt, created_at, cover_image_url, channel:channels ( name_he )')
            .eq('author_id', profileId)
            .eq('status', 'published')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(500)

          if (allPostsRes.error) throw allPostsRes.error
          const allPosts = (allPostsRes.data ?? []) as PostBase[]
          const ids = allPosts.map((p) => p.id)

          const counts = new Map<string, number>()
          if (ids.length) {
            if (sort === 'comments') {
              const cRes = await supabase.from('comments').select('post_id').in('post_id', ids).limit(5000)
              if (cRes.error) throw cRes.error
              for (const row of cRes.data ?? []) {
                const pid = (row as { post_id: string }).post_id
                counts.set(pid, (counts.get(pid) ?? 0) + 1)
              }
            } else {
              const rRes = await supabase.from('post_reaction_votes').select('post_id').in('post_id', ids).limit(5000)
              if (rRes.error) throw rRes.error
              for (const row of rRes.data ?? []) {
                const pid = (row as { post_id: string }).post_id
                counts.set(pid, (counts.get(pid) ?? 0) + 1)
              }
            }
          }

          const byId = new Map(allPosts.map((p) => [p.id, p]))
          sortedIds = [...ids].sort((a, b) => {
            const ca = counts.get(a) ?? 0
            const cb = counts.get(b) ?? 0
            if (cb !== ca) return cb - ca
            const da = new Date(byId.get(a)?.created_at ?? 0).getTime()
            const db = new Date(byId.get(b)?.created_at ?? 0).getTime()
            return db - da
          })

          setSortedIdsCache((prev) => ({ ...prev, [cacheKey]: sortedIds! }))
        }

        const sliceIds = sortedIds.slice(from, to + 1)
        if (sliceIds.length === 0) {
          if (!cancelled) setPosts([])
          return
        }

        const res = await supabase
          .from('posts')
          .select(
            `id, slug, title, excerpt, created_at, cover_image_url,
            channel:channels ( name_he )`
          )
          .in('id', sliceIds)
          .is('deleted_at', null)

        if (res.error) throw res.error

        const byId = new Map((res.data ?? []).map((p) => [(p as PostRow).id, p as PostRow]))
        const ordered = sliceIds
          .map((id) => byId.get(id))
          .filter((p): p is PostRow => Boolean(p))
          .map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            created_at: p.created_at,
            cover_image_url: p.cover_image_url,
            channel_name: p.channel?.[0]?.name_he ?? null,
            author_name: username,
            author_username: username,
            tags: [],
            medals: null,
          })) as PostCardPost[]

        if (!cancelled) setPosts(ordered)
      } catch (e: unknown) {
        if (!cancelled) setError(getErrorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [profileId, username, sort, page, perPage, sortedIdsCache, refreshKey])

  const pages = useMemo(() => {
    const n = totalPages
    const cur = clampPage(page)
    const out: number[] = []
    const start = Math.max(1, cur - 2)
    const end = Math.min(n, cur + 2)
    for (let i = start; i <= end; i++) out.push(i)
    if (out[0] !== 1) out.unshift(1)
    if (out[out.length - 1] !== n) out.push(n)
    return [...new Set(out)]
  }, [page, totalPages])

  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">פוסטים</h2>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setSort('recent')}
            className={`rounded px-3 py-1.5 ${sort === 'recent' ? 'bg-neutral-900 text-white' : 'border bg-white'}`}
          >
            אחרונים
          </button>
          <button
            type="button"
            onClick={() => setSort('reactions')}
            className={`rounded px-3 py-1.5 ${sort === 'reactions' ? 'bg-neutral-900 text-white' : 'border bg-white'}`}
          >
            ריאקשנים
          </button>
          <button
            type="button"
            onClick={() => setSort('comments')}
            className={`rounded px-3 py-1.5 ${sort === 'comments' ? 'bg-neutral-900 text-white' : 'border bg-white'}`}
          >
            תגובות
          </button>
        </div>
      </div>

      {error ? <div className="rounded border bg-white p-3 text-sm text-red-600">{error}</div> : null}

      {loading ? (
        <div className="rounded border bg-white p-6 text-sm text-muted-foreground">טוען…</div>
      ) : posts.length ? (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.slug} className="group relative">
              {isOwner && p.id ? (
                <div className="absolute left-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <Link
                    href={`/write?draft=${encodeURIComponent(p.id)}`}
                    className="rounded border bg-white/95 px-2 py-1 text-xs shadow-sm hover:bg-neutral-50"
                    title="ערוך"
                  >
                    ערוך
                  </Link>
                  <button
                    type="button"
                    onClick={() => void onDelete(p)}
                    className="rounded border bg-white/95 px-2 py-1 text-xs text-red-700 shadow-sm hover:bg-red-50"
                    title="מחק"
                  >
                    מחק
                  </button>
                </div>
              ) : null}

              <PostCard post={p} variant="mypen-row" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border bg-white p-6 text-sm text-muted-foreground">אין עדיין פוסטים.</div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            הקודם
          </button>

          {pages.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`rounded px-3 py-1.5 text-sm ${n === page ? 'bg-neutral-900 text-white' : 'border bg-white'}`}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            הבא
          </button>
        </div>
      ) : null}
    </section>
  )
}
