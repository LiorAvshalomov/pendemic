// src/app/page.tsx
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatDateTimeHe, formatRelativeHe } from '@/lib/time'
import HomeWriteCTA from '@/components/HomeWriteCTA'
import StickySidebar from '@/components/StickySidebar'

type PostRow = {
  id: string
  title: string
  slug: string
  created_at: string
  published_at: string | null
  excerpt: string | null
  cover_image_url: string | null
  subcategory_tag_id: number | null
  channel: { slug: string; name_he: string }[] | null
  author: { username: string; display_name: string | null; avatar_url: string | null }[] | null
  post_tags:
    | {
        tag:
          | {
              name_he: string
              slug: string
            }[]
          | null
      }[]
    | null
}

type ReactionVoteRow = {
  post_id: string
  reaction_key: string
  created_at: string
}

type CommentRow = {
  post_id: string
  created_at: string
}

type TagRow = {
  id: number
  name_he: string
  slug: string
}

type CardPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  created_at: string
  cover_image_url: string | null
  channel_slug: string | null
  channel_name: string | null
  author_username: string | null
  author_name: string
  author_avatar_url: string | null
  subcategory: { name_he: string; slug: string } | null
  tags: { name_he: string; slug: string }[]
  weekReactionsTotal: number
  weekCommentsTotal: number
  weekReactionsByKey: Record<string, number>
}

function firstRel<T>(rel: T[] | T | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function takeUnique(arr: CardPost[], n: number, used: Set<string>) {
  const out: CardPost[] = []
  for (const p of arr) {
    if (used.has(p.id)) continue
    used.add(p.id)
    out.push(p)
    if (out.length >= n) break
  }
  return out
}

function Avatar({
  url,
  name,
  size = 36,
}: {
  url: string | null
  name: string
  size?: number
}) {
  const initials = name.trim().slice(0, 1) || 'P'
  return (
    <div
      className="rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-black shrink-0"
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
      ) : (
        <span style={{ fontSize: Math.max(12, Math.floor(size / 2.4)) }}>{initials}</span>
      )}
    </div>
  )
}

function truncateText(text: string, maxChars: number) {
  const t = text.trim()
  if (t.length <= maxChars) return t
  return `${t.slice(0, Math.max(0, maxChars - 1))}…`
}

function channelBadgeColor(slug: string | null) {
  if (slug === 'stories') return 'bg-blue-50 text-blue-700'
  if (slug === 'release') return 'bg-rose-50 text-rose-700'
  if (slug === 'magazine') return 'bg-purple-50 text-purple-700'
  return 'bg-gray-100 text-gray-700'
}

function toIsoDateInTz(d: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(d) // YYYY-MM-DD
}

function getOffsetForTz(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(d)

  const tzName = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0'
  // Examples: "GMT+2", "GMT+02:00", "GMT-3"
  const m = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/)
  if (!m) return '+00:00'
  const sign = m[1] === '-' ? '-' : '+'
  const hh = String(m[2]).padStart(2, '0')
  const mm = String(m[3] ?? '00').padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

function getWeekRangeIsrael(now: Date): { startIso: string; endIso: string } {
  const tz = 'Asia/Jerusalem'
  const isoDate = toIsoDateInTz(now, tz) // YYYY-MM-DD (local)
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now)
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const dow = dowMap[weekday] ?? 0

  const offset = getOffsetForTz(now, tz)
  const localMidnight = new Date(`${isoDate}T00:00:00${offset}`)
  const start = new Date(localMidnight.getTime() - dow * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <Link href={href} className="text-lg font-black tracking-tight hover:text-sky-700 transition-colors">
        {title}
      </Link>
    </div>
  )
}

function FeaturedPost({ post }: { post: CardPost }) {
  return (
    <article className="group bg-slate-100/70 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-[1px] border border-black/10">
      <div className="lg:grid lg:grid-cols-2">
        {/* Image */}
        <div className="order-1 lg:order-2">
          <Link href={`/post/${post.slug}`} className="block">
            <div className="relative aspect-[16/10] lg:aspect-square lg:h-full bg-gray-100">
              {post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
              ) : null}
            </div>
          </Link>
        </div>

        {/* Content */}
        <div className="order-2 lg:order-1 p-5 sm:p-6 lg:p-10 flex flex-col justify-center">
          {/* Author FIRST (as you asked) */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar url={post.author_avatar_url} name={post.author_name} size={40} />
            <div className="min-w-0">
              {post.author_username ? (
                <Link href={`/u/${post.author_username}`} className="font-bold text-sm hover:text-sky-700 transition-colors">
                  {post.author_name}
                </Link>
              ) : (
                <span className="font-bold text-sm">{post.author_name}</span>
              )}
              <div className="text-xs text-gray-500">
                <span title={formatDateTimeHe(post.created_at)}>{formatRelativeHe(post.created_at)}</span>
                {post.subcategory ? (
                  <>
                    <span className="mx-2">•</span>
                    <span className="font-semibold text-gray-600">{post.subcategory.name_he}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Channel badge (optional) */}
          {post.channel_name && post.channel_slug ? (
            <div className="mb-3">
              <Link href={`/c/${post.channel_slug}`}>
                <span className={`inline-flex px-3 py-1 rounded-full font-semibold text-xs ${channelBadgeColor(post.channel_slug)}`}>
                  {post.channel_name}
                </span>
              </Link>
            </div>
          ) : null}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3">
            <Link href={`/post/${post.slug}`} className="hover:text-sky-700 transition-colors">
              {post.title}
            </Link>
          </h1>

          {/* Excerpt */}
          {post.excerpt ? (
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 line-clamp-3">
              {truncateText(post.excerpt, 150)}
            </p>
          ) : null}

          {/* Small meta row */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>תגובות: {post.weekCommentsTotal}</span>
            <span>•</span>
            <span>ריאקשנים: {post.weekReactionsTotal}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

function SimplePostCard({ post }: { post: CardPost }) {
  return (
    <article className="group bg-slate-100/70 rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-[1px] border border-black/10">
      <Link href={`/post/${post.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-gray-100">
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
          ) : null}
        </div>
      </Link>

      <div className="p-4 text-right">
        <div className="text-xs text-gray-500 mb-2">
          <span title={formatDateTimeHe(post.created_at)}>{formatRelativeHe(post.created_at)}</span>
          {post.subcategory ? (
            <>
              <span className="mx-2">•</span>
              <span className="font-semibold">{post.subcategory.name_he}</span>
            </>
          ) : null}
        </div>

        <h3 className="text-base font-black leading-snug line-clamp-2">
          <Link href={`/post/${post.slug}`} className="hover:text-sky-700 transition-colors">
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
            {truncateText(post.excerpt, 90)}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-start gap-2 text-xs text-gray-700">
          {post.author_username ? (
            <Link href={`/u/${post.author_username}`} className="group/author inline-flex items-center gap-2">
              <Avatar url={post.author_avatar_url} name={post.author_name} size={24} />
              <span className="font-semibold transition-colors group-hover/author:text-sky-700">{post.author_name}</span>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2">
              <Avatar url={post.author_avatar_url} name={post.author_name} size={24} />
              <span className="font-semibold">{post.author_name}</span>
            </div>
          )}
        </div>

        {/* Small proof these are "hot" this week */}
        {/* <div className="mt-2 text-[11px] text-gray-500">
          השבוע: <span className="font-semibold">{post.weekReactionsTotal}</span> ❤️
          <span className="mx-1">•</span>
          <span className="font-semibold">{post.weekCommentsTotal}</span> תגובות
        </div> */}
      </div>
    </article>
  )
}

function ListRowCompact({ post }: { post: CardPost }) {
  return (
    <article className="group bg-slate-100/70 rounded-2xl border border-black/10 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] hover:ring-1 hover:ring-black/10 active:scale-[0.99]">
      <Link href={`/post/${post.slug}`} className="block">
        {/* In RTL, flex-row-reverse keeps the image on the LEFT (as requested) */}
        <div className="flex flex-row-reverse items-start gap-4">
          <div className="w-[112px] sm:w-[136px] shrink-0">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
              {post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1 text-right">
            <div className="text-xs text-gray-500">
              <span title={formatDateTimeHe(post.created_at)}>{formatRelativeHe(post.created_at)}</span>
              {post.subcategory ? (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-semibold text-gray-700">{post.subcategory.name_he}</span>
                </>
              ) : null}
            </div>

            <div className="mt-1 text-[15px] sm:text-base font-black leading-snug line-clamp-2 transition-colors group-hover:text-sky-700">
              {post.title}
            </div>

            {post.excerpt ? (
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                {truncateText(post.excerpt, 90)}
              </p>
            ) : null}

            {/* Author row UNDER excerpt (as requested) */}
            <div className="mt-2 flex items-center justify-start gap-2 text-xs text-gray-700">
              {post.author_username ? (
                <Link href={`/u/${post.author_username}`} className="group/author inline-flex items-center gap-2">
                  <Avatar url={post.author_avatar_url} name={post.author_name} size={24} />
                  <span className="font-semibold transition-colors group-hover/author:text-sky-700">{post.author_name}</span>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2">
                  <Avatar url={post.author_avatar_url} name={post.author_name} size={24} />
                  <span className="font-semibold">{post.author_name}</span>
                </div>
              )}
            </div>

            {post.tags.length ? (
              <div className="mt-2 flex flex-wrap justify-end gap-1">
                {post.tags.slice(0, 2).map(t => (
                  <span
                    key={t.slug}
                    className="inline-flex rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-gray-700"
                  >
                    {t.name_he}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  )
}

function RecentMiniRow({ post }: { post: CardPost }) {
  return (
    <div className="group rounded-2xl border border-black/10 bg-slate-100/70 p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] active:scale-[0.99]">
      <Link href={`/post/${post.slug}`} className="block">
        {/* In RTL, flex-row-reverse keeps the image on the LEFT (as requested) */}
        <div className="flex flex-row-reverse items-start gap-3">
          <div className="w-[86px] shrink-0">
            <div className="relative aspect-[4/3] rounded overflow-hidden bg-gray-100">
              {post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1 text-right">
            <div className="text-sm font-black leading-snug line-clamp-2 transition-colors group-hover:text-sky-700">{post.title}</div>
            <div className="mt-1 text-[12px] text-gray-500">
              {post.author_username ? (
                <Link href={`/u/${post.author_username}`} className="font-semibold hover:text-sky-700 transition-colors">
                  {post.author_name}
                </Link>
              ) : (
                <span className="font-semibold">{post.author_name}</span>
              )}
              <span className="mx-1">•</span>
              <span title={formatDateTimeHe(post.created_at)}>{formatRelativeHe(post.created_at)}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default async function HomePage() {
  const { data: rows, error } = await supabase
    .from('posts')
    .select(
      `
      id,
      title,
      slug,
      created_at,
      published_at,
      excerpt,
      cover_image_url,
      subcategory_tag_id,
      channel:channels ( slug, name_he ),
      author:profiles!posts_author_id_fkey ( username, display_name, avatar_url ),
      post_tags:post_tags!fk_post_tags_post_id_posts ( tag:tags!fk_post_tags_tag_id_tags ( name_he, slug ) )
      `
    )
    .is('deleted_at', null)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(250)

  if (error) {
    return (
      <main className="min-h-screen" dir="rtl">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-xl font-bold">שגיאה בטעינת דף הבית</h1>
          <pre className="mt-4 rounded border bg-white p-4 text-xs">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </main>
    )
  }

  const posts = (rows ?? []) as PostRow[]
  const postIds = posts.map(p => p.id)

  // --- Subcategory tags map ---
  const subcatIds = Array.from(new Set(posts.map(p => p.subcategory_tag_id).filter((v): v is number => typeof v === 'number')))
  const tagsMap = new Map<number, { name_he: string; slug: string }>()
  if (subcatIds.length > 0) {
    const { data: tagRows } = await supabase.from('tags').select('id,name_he,slug').in('id', subcatIds)
    ;(tagRows ?? []).forEach(r => {
      const tr = r as TagRow
      tagsMap.set(tr.id, { name_he: tr.name_he, slug: tr.slug })
    })
  }

  // --- Weekly window (Israel Sunday 00:00 -> next Sunday 00:00) ---
  const { startIso, endIso } = getWeekRangeIsrael(new Date())

  // --- Fetch weekly reactions + comments only for these posts ---
  const weekReactionsByPost = new Map<string, number>()
  const weekReactionsByKeyByPost = new Map<string, Record<string, number>>()
  const weekCommentsByPost = new Map<string, number>()

  if (postIds.length > 0) {
    const [{ data: reactionRows }, { data: commentRows }] = await Promise.all([
      supabase
        .from('post_reaction_votes')
        .select('post_id,reaction_key,created_at')
        .in('post_id', postIds)
        .gte('created_at', startIso)
        .lt('created_at', endIso),
      supabase
        .from('comments')
        .select('post_id,created_at')
        .in('post_id', postIds)
        .gte('created_at', startIso)
        .lt('created_at', endIso),
    ])

    ;(reactionRows ?? []).forEach(r0 => {
      const r = r0 as ReactionVoteRow
      weekReactionsByPost.set(r.post_id, (weekReactionsByPost.get(r.post_id) ?? 0) + 1)

      const key = r.reaction_key.trim()
      const prev = weekReactionsByKeyByPost.get(r.post_id) ?? {}
      prev[key] = (prev[key] ?? 0) + 1
      weekReactionsByKeyByPost.set(r.post_id, prev)
    })

    ;(commentRows ?? []).forEach(c0 => {
      const c = c0 as CommentRow
      weekCommentsByPost.set(c.post_id, (weekCommentsByPost.get(c.post_id) ?? 0) + 1)
    })
  }

  // --- Build cards ---
  const cardPosts: CardPost[] = posts.map(p => {
    const channel = firstRel(p.channel)
    const author = firstRel(p.author)

    const tags = (p.post_tags ?? [])
      .flatMap(pt => {
        const t = firstRel(pt.tag)
        return t ? [t] : []
      })
      .map(t => ({ name_he: t.name_he, slug: t.slug }))

    const createdAt = p.published_at ?? p.created_at
    const subcategory = p.subcategory_tag_id != null ? (tagsMap.get(p.subcategory_tag_id) ?? null) : null

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      created_at: createdAt,
      cover_image_url: p.cover_image_url,
      channel_slug: channel?.slug ?? null,
      channel_name: channel?.name_he ?? null,
      author_username: author?.username ?? null,
      author_name: author?.display_name ?? author?.username ?? 'אנונימי',
      author_avatar_url: author?.avatar_url ?? null,
      subcategory,
      tags,
      weekReactionsTotal: weekReactionsByPost.get(p.id) ?? 0,
      weekCommentsTotal: weekCommentsByPost.get(p.id) ?? 0,
      weekReactionsByKey: weekReactionsByKeyByPost.get(p.id) ?? {},
    }
  })

  // --- Weekly featured: reactions desc, then comments desc, then newest ---
  const byWeeklyFeatured = [...cardPosts].sort((a, b) => {
    if (b.weekReactionsTotal !== a.weekReactionsTotal) return b.weekReactionsTotal - a.weekReactionsTotal
    if (b.weekCommentsTotal !== a.weekCommentsTotal) return b.weekCommentsTotal - a.weekCommentsTotal
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const used = new Set<string>()

  const featured = byWeeklyFeatured[0] ?? null
  if (featured) used.add(featured.id)

  // --- Top 3 posts (hidden categories): funny/moving/creative, only stories+release ---
  const eligibleTop = cardPosts.filter(p => p.channel_slug === 'stories' || p.channel_slug === 'release')

  const topByKey = (key: string): CardPost | null => {
    const sorted = [...eligibleTop].sort((a, b) => {
      const av = a.weekReactionsByKey[key] ?? 0
      const bv = b.weekReactionsByKey[key] ?? 0
      if (bv !== av) return bv - av
      // fallback: total reactions then newest
      if (b.weekReactionsTotal !== a.weekReactionsTotal) return b.weekReactionsTotal - a.weekReactionsTotal
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return sorted.find(p => !used.has(p.id)) ?? null
  }

  const top1 = topByKey('funny')
  if (top1) used.add(top1.id)
  const top2 = topByKey('moving')
  if (top2) used.add(top2.id)
  const top3 = topByKey('creative')
  if (top3) used.add(top3.id)

  // --- Section lists: "hot" in the same weekly window, exclude anything already used ---
  const byRecent = [...cardPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const pickHotSection = (channelSlug: string, n: number): CardPost[] => {
    const inChannel = cardPosts.filter(p => p.channel_slug === channelSlug)
    const hasAnyWeeklySignal = inChannel.some(p => p.weekReactionsTotal > 0 || p.weekCommentsTotal > 0)

    const sorted = [...inChannel].sort((a, b) => {
      if (hasAnyWeeklySignal) {
        if (b.weekReactionsTotal !== a.weekReactionsTotal) return b.weekReactionsTotal - a.weekReactionsTotal
        if (b.weekCommentsTotal !== a.weekCommentsTotal) return b.weekCommentsTotal - a.weekCommentsTotal
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const out: CardPost[] = []
    for (const p of sorted) {
      if (used.has(p.id)) continue
      used.add(p.id)
      out.push(p)
      if (out.length >= n) break
    }
    return out
  }

  const stories = pickHotSection('stories', 5)
  const release = pickHotSection('release', 5)
  const magazine = pickHotSection('magazine', 5)

  const recentMini = byRecent.slice(0, 10)

  // --- Writers of week: prefer medals, fallback to total weekly reactions ---
  const writerScores = (() => {
    const map = new Map<
      string,
      {
        username: string | null
        name: string
        gold: number
        silver: number
        bronze: number
        reactions: number
        avatar_url: string | null
      }
    >()

    for (const p of cardPosts) {
      const key = p.author_username ?? p.author_name
      const prev = map.get(key) ?? { username: p.author_username, name: p.author_name, gold: 0, silver: 0, bronze: 0, reactions: 0, avatar_url: p.author_avatar_url }
      prev.gold += p.weekReactionsByKey['gold'] ?? 0
      prev.silver += p.weekReactionsByKey['silver'] ?? 0
      prev.bronze += p.weekReactionsByKey['bronze'] ?? 0
      prev.reactions += p.weekReactionsTotal
      if (!prev.avatar_url && p.author_avatar_url) prev.avatar_url = p.author_avatar_url
      map.set(key, prev)
    }

    const arr = Array.from(map.values()).map(v => {
      const medalScore = v.gold * 3 + v.silver * 2 + v.bronze
      return {
        ...v,
        medalScore,
      }
    })

    // Sort by medals first, then total reactions
    arr.sort((a, b) => {
      if (b.medalScore !== a.medalScore) return b.medalScore - a.medalScore
      if (b.reactions !== a.reactions) return b.reactions - a.reactions
      if (b.gold !== a.gold) return b.gold - a.gold
      if (b.silver !== a.silver) return b.silver - a.silver
      return b.bronze - a.bronze
    })

    return arr.filter(a => a.reactions > 0).slice(0, 5)
  })()

  return (
    <main className="min-h-screen" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="space-y-8">
          {/* Top of page: featured + top posts */}
          <div className="space-y-6">
            {featured ? (
              <div>
                <FeaturedPost post={featured} />
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-black tracking-tight">פוסטים מובילים</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {top1 ? <SimplePostCard post={top1} /> : null}
                {top2 ? <SimplePostCard post={top2} /> : null}
                {top3 ? <SimplePostCard post={top3} /> : null}
              </div>
            </div>
          </div>

          {/* Below: categories on the right, sidebar on the left */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            {/* Categories */}
            <div className="space-y-8">
              <div>
                <SectionHeader title="סיפורים" href="/c/stories" />
                <div className="space-y-3">
                  {stories.map(p => (
                    <ListRowCompact key={p.id} post={p} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader title="פריקה" href="/c/release" />
                <div className="space-y-3">
                  {release.map(p => (
                    <ListRowCompact key={p.id} post={p} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader title="מגזין" href="/c/magazine" />
                <div className="space-y-3">
                  {magazine.map(p => (
                    <ListRowCompact key={p.id} post={p} />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar (sticky, NO internal scrolling) */}
            <StickySidebar>
              <div className="space-y-8">
                {/* Recent posts FIRST */}
                <div className="bg-slate-100/70 rounded-2xl p-5 shadow-sm border border-black/10">
                  <div className="text-base font-black mb-4">פוסטים אחרונים</div>
                  <div className="space-y-3">
                    {recentMini.slice(0, 8).map(p => (
                      <RecentMiniRow key={p.id} post={p} />
                    ))}
                  </div>
                </div>

                {/* Writers of week */}
                <div className="bg-slate-100/70 rounded-2xl p-5 shadow-sm border border-black/10">
                  <div className="text-base font-black mb-4">כותבי השבוע</div>

                  {writerScores.length ? (
                    <div className="space-y-3">
                      {writerScores.map((w, idx) => (
                        <div key={`${w.username ?? w.name}`} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-xs font-black text-gray-700">
                              {idx + 1}
                            </div>

                            {w.username ? (
                              <Link href={`/u/${w.username}`} className="group/writer inline-flex items-center gap-2">
                                <Avatar url={w.avatar_url} name={w.name} size={36} />
                                <span className="text-sm font-bold transition-colors group-hover/writer:text-sky-700">
                                  {w.name}
                                </span>
                              </Link>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <Avatar url={w.avatar_url} name={w.name} size={36} />
                                <span className="text-sm font-bold">{w.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-700 flex items-center gap-2">
                            {w.gold ? <span>🥇 {w.gold}</span> : null}
                            {w.silver ? <span>🥈 {w.silver}</span> : null}
                            {w.bronze ? <span>🥉 {w.bronze}</span> : null}
                            {!w.gold && !w.silver && !w.bronze ? <span>❤️ {w.reactions}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">אין עדיין פעילות לשבוע הזה.</div>
                  )}

                  <div className="mt-5">
                    <HomeWriteCTA />
                  </div>
                </div>
              </div>
            </StickySidebar>
          </div>
        </div>
      </div>
    </main>
  )
}
