'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import Avatar from '@/components/Avatar'
import RichText from '@/components/RichText'
import PostShell from '@/components/PostShell'
import PostOwnerMenu from '@/components/PostOwnerMenu'
import PostReactions from '@/components/PostReactions'
import PostComments from '@/components/PostComments'
import { formatDateTimeHe } from '@/lib/time'

type Author = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type Channel = { name_he: string | null }

type PostRow = {
  id: string
  slug: string
  title: string | null
  content_json: unknown
  created_at: string
  author_id: string
  channel_id: number | null
  author: Author[] | Author | null
  channel: Channel[] | Channel | null
}

function NotFoundPost() {
  return (
    <main className="min-h-screen bg-neutral-50" dir="rtl">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">לא נמצא פוסט</h1>
          <p className="mt-3 text-sm text-muted-foreground">הפוסט לא קיים או הוסר.</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800">
              לדף הבית
            </Link>
            <Link href="/notebook" className="rounded-full border bg-white px-4 py-2 text-sm hover:bg-neutral-50">
              למחברת
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function PostPage() {
  const params = useParams()
  const slug = useMemo(() => (typeof params?.slug === 'string' ? params.slug : ''), [params])

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [post, setPost] = useState<PostRow | null>(null)

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setNotFound(false)
      setPost(null)

      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          id,
          slug,
          title,
          content_json,
          created_at,
          author_id,
          channel_id,
          channel:channels ( name_he ),
          author:profiles!posts_author_id_fkey ( id, username, display_name, avatar_url )
        `
        )
        .is('deleted_at', null)
        .eq('slug', slug)
        .single()

      if (cancelled) return

      if (error || !data) {
        // PGRST116 = 0 rows for .single()
        setNotFound(true)
        setLoading(false)
        return
      }

      setPost(data as PostRow)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50" dir="rtl">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="text-sm text-muted-foreground">טוען…</div>
        </div>
      </main>
    )
  }

  if (notFound || !post) {
    return <NotFoundPost />
  }

  const author: Author | null = Array.isArray(post.author)
    ? (post.author[0] ?? null)
    : (post.author as Author | null)

  const channelName: string | null = Array.isArray(post.channel)
    ? (post.channel[0]?.name_he ?? null)
    : (post.channel as Channel | null)?.name_he ?? null

  const authorName = author?.display_name ?? 'אנונימי'
  const authorUsername = author?.username ?? null

  const channelHref =
    post.channel_id === 1
      ? '/c/release'
      : post.channel_id === 2
        ? '/c/stories'
        : post.channel_id === 3
          ? '/c/magazine'
          : null

  return (
    <PostShell
      title={post.title}
      actions={<PostOwnerMenu postId={post.id} postSlug={slug} authorId={post.author_id} />}
      meta={
        <>
          {channelName && channelHref ? (
            <>
              <Link href={channelHref} className="text-blue-700 hover:underline">
                {channelName}
              </Link>
              <span className="text-muted-foreground"> · </span>
            </>
          ) : channelName ? (
            <>
              <span className="text-muted-foreground">{channelName}</span>
              <span className="text-muted-foreground"> · </span>
            </>
          ) : null}

          {formatDateTimeHe(post.created_at)}
        </>
      }
    >
      {/* כותב */}
      <div className="mb-6 mt-2 flex items-center gap-3" dir="rtl">
        <Avatar src={author?.avatar_url ?? null} name={authorName} />
        <div className="flex flex-col">
          {authorUsername ? (
            <Link href={`/u/${authorUsername}`} className="font-semibold hover:underline">
              {authorName}
            </Link>
          ) : (
            <span className="font-semibold">{authorName}</span>
          )}
          {authorUsername ? <span className="text-sm text-muted-foreground">@{authorUsername}</span> : null}
        </div>
      </div>

      {/* תוכן */}
      <RichText content={post.content_json} />

      {/* ריאקשנים */}
      <div className="mt-6">
        <PostReactions postId={post.id} channelId={post.channel_id ?? 0} authorId={post.author_id} />
      </div>

      <PostComments postId={post.id} />
    </PostShell>
  )
}
