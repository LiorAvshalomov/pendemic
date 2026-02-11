import { NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin/requireAdminFromRequest'

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

function getSystemUserId(): string | null {
  const v = process.env.NEXT_PUBLIC_SYSTEM_USER_ID
  if (typeof v === 'string' && v.trim()) return v.trim()
  const v2 = process.env.SYSTEM_USER_ID
  if (typeof v2 === 'string' && v2.trim()) return v2.trim()
  return null
}

export async function GET(req: Request) {
  const auth = await requireAdminFromRequest(req)
  if (!auth.ok) return auth.response

  const systemUserId = getSystemUserId()
  if (!systemUserId) {
    return NextResponse.json({ error: 'missing SYSTEM_USER_ID (NEXT_PUBLIC_SYSTEM_USER_ID)' }, { status: 500 })
  }

  // 1) all conversations where system is a member
  const { data: cm, error: cmErr } = await auth.admin
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', systemUserId)
    .limit(200)

  if (cmErr) return NextResponse.json({ error: cmErr.message }, { status: 500 })

  const conversationIds = (cm ?? []).map((r) => String((r as any).conversation_id)).filter(Boolean)
  if (conversationIds.length === 0) {
    return NextResponse.json({ threads: [] })
  }

  // 2) members for those conversations -> find the "other" user per conversation
  const { data: members, error: mErr } = await auth.admin
    .from('conversation_members')
    .select('conversation_id, user_id')
    .in('conversation_id', conversationIds)

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  const otherByConv = new Map<string, string>()
  for (const row of members ?? []) {
    const convId = String((row as any).conversation_id)
    const uid = String((row as any).user_id)
    if (!convId || !uid) continue
    if (uid === systemUserId) continue
    // one-to-one chat assumed
    if (!otherByConv.has(convId)) otherByConv.set(convId, uid)
  }

  const otherUserIds = Array.from(new Set(Array.from(otherByConv.values())))

  // 3) profiles for other users
  const { data: profs, error: pErr } = await auth.admin
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', otherUserIds)

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  const profById = new Map<string, { username: string; display_name: string | null; avatar_url: string | null }>()
  for (const p of profs ?? []) {
    const id = String((p as any).id)
    if (!id) continue
    profById.set(id, {
      username: String((p as any).username ?? ''),
      display_name: ((p as any).display_name ?? null) as string | null,
      avatar_url: ((p as any).avatar_url ?? null) as string | null,
    })
  }

  // 4) last messages for those conversations (fetch a pool of newest messages and pick first per conversation)
  const { data: msgs, error: msgErr } = await auth.admin
    .from('messages')
    .select('id, conversation_id, body, created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })
    .limit(500)

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 })

  const lastByConv = new Map<string, { body: string | null; created_at: string | null }>()
  for (const m of msgs ?? []) {
    const cid = String((m as any).conversation_id)
    if (!cid || lastByConv.has(cid)) continue
    lastByConv.set(cid, {
      body: ((m as any).body ?? null) as string | null,
      created_at: ((m as any).created_at ?? null) as string | null,
    })
  }

  // 5) unread counts (messages from other user with read_at null)
  const { data: unreadRows, error: uErr } = await auth.admin
    .from('messages')
    .select('conversation_id, sender_id, read_at')
    .in('conversation_id', conversationIds)
    .is('read_at', null)
    .neq('sender_id', systemUserId)
    .limit(2000)

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  const unreadCountByConv = new Map<string, number>()
  for (const r of unreadRows ?? []) {
    const cid = String((r as any).conversation_id)
    if (!cid) continue
    unreadCountByConv.set(cid, (unreadCountByConv.get(cid) ?? 0) + 1)
  }

  const threads: Thread[] = []
  for (const cid of conversationIds) {
    const otherId = otherByConv.get(cid)
    if (!otherId) continue
    const p = profById.get(otherId)
    if (!p) continue
    const last = lastByConv.get(cid) ?? { body: null, created_at: null }
    threads.push({
      conversation_id: cid,
      other_user_id: otherId,
      other_username: p.username,
      other_display_name: p.display_name,
      other_avatar_url: p.avatar_url,
      last_body: last.body,
      last_created_at: last.created_at,
      unread_count: unreadCountByConv.get(cid) ?? 0,
    })
  }

  // Sort by last_created_at desc
  threads.sort((a, b) => {
    const ta = a.last_created_at ? +new Date(a.last_created_at) : 0
    const tb = b.last_created_at ? +new Date(b.last_created_at) : 0
    return tb - ta
  })

  return NextResponse.json({ threads })
}
