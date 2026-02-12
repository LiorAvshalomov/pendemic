import { NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin/requireAdminFromRequest'

export async function GET(req: Request) {
  const auth = await requireAdminFromRequest(req)
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const userId = (url.searchParams.get('user_id') ?? '').trim()

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'missing user_id' }, { status: 400 })
  }

  const { data: profile, error: pErr } = await auth.admin
    .from('profiles')
    .select('id, username, display_name, avatar_url, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (pErr) {
    return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 })
  }
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'user not found' }, { status: 404 })
  }

  const { data: mod, error: mErr } = await auth.admin
    .from('user_moderation')
    .select('user_id, is_suspended, reason, suspended_at, suspended_by, is_banned, ban_reason, banned_at, banned_by')
    .eq('user_id', userId)
    .maybeSingle()

  if (mErr) {
    return NextResponse.json({ ok: false, error: mErr.message }, { status: 500 })
  }

  type ModRow = {
    user_id: string; is_suspended: boolean; reason: string | null;
    suspended_at: string | null; suspended_by: string | null;
    is_banned: boolean; ban_reason: string | null;
    banned_at: string | null; banned_by: string | null
  }
  const m = mod as ModRow | null

  return NextResponse.json({
    ok: true,
    user: {
      ...profile,
      moderation: m
        ? {
            is_suspended: Boolean(m.is_suspended),
            reason: m.reason ?? null,
            suspended_at: m.suspended_at ?? null,
            suspended_by: m.suspended_by ?? null,
            is_banned: Boolean(m.is_banned),
            ban_reason: m.ban_reason ?? null,
            banned_at: m.banned_at ?? null,
            banned_by: m.banned_by ?? null,
          }
        : {
            is_suspended: false,
            reason: null,
            suspended_at: null,
            suspended_by: null,
            is_banned: false,
            ban_reason: null,
            banned_at: null,
            banned_by: null,
          },
    },
  })
}
