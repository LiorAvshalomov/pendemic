import type { SupabaseClient } from '@supabase/supabase-js'

export type PostPurgeActorKind = 'user' | 'admin' | 'system'

export type PostPurgeSnapshot = {
  title?: string | null
  slug?: string | null
  author_id?: string | null
  channel_id?: string | null
  status?: string | null
  published_at?: string | null
  created_at?: string | null
  deleted_at?: string | null
  is_anonymous?: boolean | null
}

export type PostPurgeEventInput = {
  postId: string
  authorId: string
  actorUserId?: string | null
  actorKind: PostPurgeActorKind
  reason?: string | null
  source?: string | null
  createdAt?: string
  postSnapshot?: PostPurgeSnapshot
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

export async function logPostPurgeEvents(
  admin: SupabaseClient,
  events: PostPurgeEventInput[],
): Promise<void> {
  const rows = events
    .filter((event) => event.postId.trim() && event.authorId.trim())
    .map((event) => ({
      post_id: event.postId.trim(),
      author_id: event.authorId.trim(),
      actor_user_id: event.actorUserId?.trim() || null,
      actor_kind: event.actorKind,
      reason: event.reason?.trim() || null,
      source: event.source?.trim() || null,
      post_snapshot: event.postSnapshot ?? {},
      created_at: event.createdAt ?? new Date().toISOString(),
    }))

  if (rows.length === 0) return

  for (const batch of chunk(rows, 100)) {
    const { error } = await admin
      .from('post_purge_events')
      .upsert(batch as never, { onConflict: 'post_id', ignoreDuplicates: true })

    if (error) throw error
  }
}
