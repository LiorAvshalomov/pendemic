import { supabase } from '@/lib/supabaseClient'
import ProfileAvatarFrame from '@/components/ProfileAvatarFrame'
import ProfileRecentActivity from '@/components/ProfileRecentActivity'
import ProfileFollowBar from '@/components/ProfileFollowBar'
import ProfileBottomTabsClient from '@/components/ProfileBottomTabsClient'
import ProfilePersonalInfoCardClient from '@/components/ProfilePersonalInfoCardClient'

type PageProps = {
  params: Promise<{ username: string }>
}

type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string | null

  // personal info (optional)
  personal_is_shared?: boolean | null
  personal_about?: string | null
  personal_age?: number | null
  personal_occupation?: string | null
  personal_writing_about?: string | null
  personal_books?: string | null
  personal_favorite_category?: string | null
}

type PostRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  created_at: string
  is_anonymous: boolean | null
  channel: { name_he: string }[] | null
  post_tags:
    | {
        tag:
          | {
              slug: string
              name_he: string
            }[]
          | null
      }[]
    | null
}

type SummaryRow = {
  post_id: string
  gold: number | null
  silver: number | null
  bronze: number | null
}

function safeText(s?: string | null) {
  return (s ?? '').trim()
}

function MedalPills({ gold, silver, bronze }: { gold: number; silver: number; bronze: number }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="rounded-full border bg-neutral-50 px-3 py-1 text-sm">🥉 {bronze}</span>
      <span className="rounded-full border bg-neutral-50 px-3 py-1 text-sm">🥈 {silver}</span>
      <span className="rounded-full border bg-neutral-50 px-3 py-1 text-sm">🥇 {gold}</span>
    </div>
  )
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, avatar_url, bio, created_at, personal_is_shared, personal_about, personal_age, personal_occupation, personal_writing_about, personal_books, personal_favorite_category'
    )
    .eq('username', username)
    .single()

  if (pErr || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <h1 className="text-2xl font-bold">לא נמצא פרופיל</h1>
        <p className="mt-2 text-sm text-muted-foreground">המשתמש @{username} לא קיים או הוסר.</p>
      </div>
    )
  }

  const prof = profile as Profile

  // initial counts (server)
  const { count: followersCount = 0 } = await supabase
    .from('user_follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', prof.id)

  const { count: followingCount = 0 } = await supabase
    .from('user_follows')
    .select('following_id', { count: 'exact', head: true })
    .eq('follower_id', prof.id)

  // Count total posts (for stats). We don't pull all posts on the server
  // because the profile bottom list is now fully client-side with pagination.
  const { count: postsCount = 0 } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('author_id', prof.id)
    .eq('status', 'published')
    .eq('is_anonymous', false)

  const displayName = safeText(prof.display_name) || 'אנונימי'
  const bio = safeText(prof.bio)

  // Collect ids for "תגובות שקיבל" stat (bounded so we don't overload on huge accounts)
  const { data: postIdsRows } = await supabase
    .from('posts')
    .select('id')
    .is('deleted_at', null)
    .eq('author_id', prof.id)
    .eq('status', 'published')
    .eq('is_anonymous', false)
    .order('created_at', { ascending: false })
    .limit(5000)

  const { count: commentsWritten = 0 } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', prof.id)

  let commentsReceived = 0
  const postIds = (postIdsRows ?? []).map(r => r.id)
  if (postIds.length > 0) {
    const { count } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .in('post_id', postIds)

    commentsReceived = count ?? 0
  }

  // medals (all-time)
  const { data: medalsRow } = await supabase
    .from('profile_medals_all_time')
    .select('gold, silver, bronze')
    .eq('profile_id', prof.id)
    .maybeSingle()

  const medals = {
    gold: medalsRow?.gold ?? 0,
    silver: medalsRow?.silver ?? 0,
    bronze: medalsRow?.bronze ?? 0,
  }

  // ✅ bring reaction totals via RPC (returns ALL reactions incl. zeros)
  const { data: reactionTotals, error: rtErr } = await supabase.rpc('get_profile_reaction_totals', {
    p_profile_id: prof.id,
  })

  if (rtErr) {
    // לא שובר את הפרופיל אם יש בעיה — רק לוג לצורך debug
    console.error('get_profile_reaction_totals error:', rtErr)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8" dir="rtl">
      <section className="rounded-3xl border bg-white p-4 shadow-sm sm:p-5">
        {/* HEADER (match your mockup) */}
        <div className="mt-2">
          {/* Mobile: avatar centered + name + bio centered */}
          <div className="sm:hidden">
            <div className="flex flex-col items-center text-center">
              <ProfileAvatarFrame src={prof.avatar_url} name={displayName} size={176} shape="square" />
              <h1 className="mt-4 break-words text-3xl font-bold leading-tight">{displayName}</h1>
              <div className="mt-1 text-sm text-muted-foreground">@{prof.username}</div>

              {bio ? (
                <p className="mt-3 max-w-[42ch] break-words text-sm leading-6 text-neutral-700 [overflow-wrap:anywhere]">
                  {bio}
                </p>
              ) : null}

              {/* Stats pills */}
              <div className="mt-4 grid w-full grid-cols-3 gap-2">
                <StatPill label="פוסטים" value={postsCount ?? 0} />
                <StatPill label="תגובות שכתב" value={commentsWritten ?? 0} />
                <StatPill label="תגובות שקיבל" value={commentsReceived} />
              </div>

              {/* Medals (mobile: under stats, centered) */}
              <div className="mt-4">
                <MedalPills gold={medals.gold} silver={medals.silver} bronze={medals.bronze} />
              </div>
            </div>
          </div>

          {/* Desktop: medals top-left, avatar top-right, name to the LEFT of avatar. Bio + stats centered. */}
          <div className="hidden sm:block">
            <div className="relative">
              <div className="absolute left-0 top-0">
                <MedalPills gold={medals.gold} silver={medals.silver} bronze={medals.bronze} />
              </div>

              <div className="flex items-start justify-end gap-5">
                <ProfileAvatarFrame src={prof.avatar_url} name={displayName} size={200} shape="square" />

                <div className="min-w-0 pt-2 text-right">
                  <h1 className="min-w-0 break-words text-4xl font-bold leading-tight">{displayName}</h1>
                  <div className="mt-1 text-sm text-muted-foreground">@{prof.username}</div>
                </div>
              </div>

              {bio ? (
                <p className="mt-6 mx-auto max-w-[52ch] break-words text-center text-sm leading-6 text-neutral-700 [overflow-wrap:anywhere]">
                  {bio}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <StatPill label="פוסטים" value={postsCount ?? 0} />
                <StatPill label="תגובות שכתב" value={commentsWritten ?? 0} />
                <StatPill label="תגובות שקיבל" value={commentsReceived} />
              </div>
            </div>
          </div>

          {/* Follow bar */}
          <div className="mt-5">
            <ProfileFollowBar
              profileId={prof.id}
              username={prof.username}
              initialFollowers={followersCount ?? 0}
              initialFollowing={followingCount ?? 0}
            />
          </div>

          {/* (Removed old shared pills+followbar block) */}
          {/* Stats pills: under the header row in mobile, inline in desktop */}
          <div className="hidden">
            <StatPill label="פוסטים" value={postsCount ?? 0} />
            <StatPill label="תגובות שכתב" value={commentsWritten ?? 0} />
            <StatPill label="תגובות שקיבל" value={commentsReceived} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProfilePersonalInfoCardClient
          profileId={prof.id}
          initial={{
            personal_is_shared: Boolean(prof.personal_is_shared),
            personal_about: prof.personal_about ?? null,
            personal_age: (prof.personal_age as number | null) ?? null,
            personal_occupation: prof.personal_occupation ?? null,
            personal_writing_about: prof.personal_writing_about ?? null,
            personal_books: prof.personal_books ?? null,
            personal_favorite_category: prof.personal_favorite_category ?? null,
          }}
        />
        <ProfileRecentActivity userId={prof.id} />
      </section>

      <ProfileBottomTabsClient
        profileId={prof.id}
        username={prof.username}
        postsCount={postsCount ?? 0}
        commentsWritten={commentsWritten ?? 0}
        commentsReceived={commentsReceived ?? 0}
        reactionTotals={reactionTotals ?? []}
      />
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-4 py-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
      <span className="text-sm font-bold leading-none">{value}</span>
      <span className="text-xs font-medium text-blue-600">{label}</span>
    </div>
  )
}
