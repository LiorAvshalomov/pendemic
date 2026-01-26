import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireUserFromRequest } from '@/lib/auth/requireUserFromRequest'

const RESTORE_WINDOW_DAYS = 14

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUserFromRequest(req)
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  const postId = (id ?? '').toString().trim()
  if (!postId) {
    return NextResponse.json({ error: { code: 'bad_request', message: 'missing post id' } }, { status: 400 })
  }

  const { data: post, error: postErr } = await auth.supabase
    .from('posts')
    .select('id, author_id, deleted_at')
    .eq('id', postId)
    .maybeSingle()

  if (postErr) return NextResponse.json({ error: { code: 'db_error', message: postErr.message } }, { status: 500 })
  if (!post) return NextResponse.json({ error: { code: 'not_found', message: 'post not found' } }, { status: 404 })
  if (post.author_id !== auth.user.id) {
    return NextResponse.json({ error: { code: 'forbidden', message: 'not your post' } }, { status: 403 })
  }
  if (!post.deleted_at) {
    return NextResponse.json({ error: { code: 'bad_request', message: 'post is not deleted' } }, { status: 400 })
  }

  // Enforce restore window
  const deletedAt = new Date(post.deleted_at)
  const maxRestore = new Date(Date.now() - RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  if (deletedAt < maxRestore) {
    return NextResponse.json(
      { error: { code: 'restore_window_expired', message: 'חלון השחזור עבר (14 יום). הפוסט יימחק לצמיתות.' } },
      { status: 400 }
    )
  }

  const { error: updErr } = await auth.supabase.from('posts').update({ deleted_at: null }).eq('id', postId)
  if (updErr) return NextResponse.json({ error: { code: 'db_error', message: updErr.message } }, { status: 500 })

  return NextResponse.json({ ok: true })
}
