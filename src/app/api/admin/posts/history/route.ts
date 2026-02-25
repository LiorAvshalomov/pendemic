import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdminFromRequest } from '@/lib/admin/requireAdminFromRequest'
import { adminError, adminOk } from '@/lib/admin/adminHttp'

const VALID_ACTIONS = new Set(['soft_delete', 'admin_soft_hide', 'hard_delete', 'admin_hard_delete'])
const VALID_ACTOR_KINDS = new Set(['user', 'admin', 'system'])

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req)
  if (!auth.ok) return auth.response

  const sb = auth.admin as unknown as SupabaseClient

  const url = new URL(req.url)
  const action     = url.searchParams.get('action')     ?? ''
  const actorKind  = url.searchParams.get('actor_kind') ?? ''
  const q          = (url.searchParams.get('q') ?? '').trim()
  const from       = url.searchParams.get('from')       ?? ''
  const to         = url.searchParams.get('to')         ?? ''

  const rawLimit  = parseInt(url.searchParams.get('limit')  ?? '50', 10)
  const rawOffset = parseInt(url.searchParams.get('offset') ?? '0',  10)
  const limit  = Math.min(Math.max(Number.isFinite(rawLimit)  ? rawLimit  : 50, 1), 100)
  const offset = Math.max(Number.isFinite(rawOffset) ? rawOffset : 0, 0)

  // q-filter is applied in-process (JSONB full-text via PostgREST is limited).
  // We over-fetch by 4× limit when q is active so pagination stays reasonable.
  const fetchLimit = q ? Math.min(limit * 4, 400) : limit

  let query = sb
    .from('deletion_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (action && VALID_ACTIONS.has(action))         query = query.eq('action', action)
  if (actorKind && VALID_ACTOR_KINDS.has(actorKind)) query = query.eq('actor_kind', actorKind)
  if (from) query = query.gte('created_at', from)
  if (to) {
    const toEnd = new Date(to)
    toEnd.setDate(toEnd.getDate() + 1)
    query = query.lt('created_at', toEnd.toISOString())
  }

  if (!q) {
    query = query.range(offset, offset + fetchLimit - 1)
  }

  const { data, error, count } = await query
  if (error) return adminError(error.message, 500, 'db_error')

  let events = (Array.isArray(data) ? data : []) as Record<string, unknown>[]

  // In-process q filter on snapshot title/slug
  if (q) {
    const ql = q.toLowerCase()
    events = events.filter((ev) => {
      const snap = isRecord(ev.post_snapshot) ? ev.post_snapshot : {}
      const title = typeof snap.title === 'string' ? snap.title.toLowerCase() : ''
      const slug  = typeof snap.slug  === 'string' ? snap.slug.toLowerCase()  : ''
      return title.includes(ql) || slug.includes(ql)
    })
    events = events.slice(offset, offset + limit)
  }

  // Collect unique user IDs for batch profile fetch
  const profileIds = new Set<string>()
  for (const ev of events) {
    if (typeof ev.actor_user_id === 'string') profileIds.add(ev.actor_user_id)
    const snap = isRecord(ev.post_snapshot) ? ev.post_snapshot : {}
    if (typeof snap.author_id === 'string') profileIds.add(snap.author_id)
  }

  const allIds = Array.from(profileIds)
  const { data: profData } = allIds.length
    ? await sb.from('profiles').select('id, username, display_name, avatar_url').in('id', allIds)
    : { data: [] }

  const profileMap = new Map<string, ProfileRow>()
  for (const p of (Array.isArray(profData) ? profData : []) as unknown[]) {
    if (!isRecord(p)) continue
    const pr = p as unknown as ProfileRow
    if (typeof pr.id === 'string') profileMap.set(pr.id, pr)
  }

  const enriched = events.map((ev) => {
    const actorId  = typeof ev.actor_user_id === 'string' ? ev.actor_user_id : null
    const snap     = isRecord(ev.post_snapshot) ? ev.post_snapshot : {}
    const authorId = typeof snap.author_id === 'string' ? snap.author_id : null
    return {
      ...ev,
      actor_profile:  actorId  ? (profileMap.get(actorId)  ?? null) : null,
      author_profile: authorId ? (profileMap.get(authorId) ?? null) : null,
    }
  })

  return adminOk({ events: enriched, total: count ?? 0 })
}
