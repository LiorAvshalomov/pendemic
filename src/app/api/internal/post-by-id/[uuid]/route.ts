import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type RouteParams = { params: Promise<{ uuid: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { uuid } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && key) {
    const supabase = createClient(supabaseUrl, key, { auth: { persistSession: false } })
    const { data } = await supabase
      .from('posts')
      .select('slug')
      .eq('id', uuid)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle<{ slug: string }>()

    if (data?.slug && data.slug !== uuid) {
      // Found post with a different (Hebrew) slug — permanent redirect
      return NextResponse.redirect(
        new URL(`/post/${encodeURIComponent(data.slug)}`, req.url),
        301,
      )
    }
  }

  // Post not found, deleted, or slug unchanged — fall through to normal page rendering.
  // ?nr=1 prevents the rewrite from looping back to this handler.
  const fallback = new URL(`/post/${uuid}`, req.url)
  fallback.searchParams.set('nr', '1')
  return NextResponse.redirect(fallback, 307)
}
