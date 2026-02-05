'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import FollowButton from '@/components/FollowButton'
import ProfileNonOwnerActions from '@/components/ProfileNonOwnerActions'

export default function ProfileFollowBar({
  profileId,
  username,
  initialFollowers,
  initialFollowing,
}: {
  profileId: string
  username: string
  initialFollowers: number
  initialFollowing: number
}) {
  const [followersCount, setFollowersCount] = useState(initialFollowers)
  const [followingCount, setFollowingCount] = useState(initialFollowing)
  const [meId, setMeId] = useState<string | null>(null)

  const isAuthed = !!meId
  const isMe = !!meId && meId === profileId

  const refreshCounts = useCallback(async () => {
    const [{ count: followers = 0 }, { count: following = 0 }] = await Promise.all([
      supabase
        .from('user_follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', profileId),
      supabase
        .from('user_follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', profileId),
    ])

    setFollowersCount(followers ?? 0)
    setFollowingCount(following ?? 0)
  }, [profileId])

  useEffect(() => {
    let mounted = true

    async function loadMe() {
      const { data, error } = await supabase.auth.getUser()
      if (!mounted) return

      if (error || !data.user?.id) {
        setMeId(null)
        return
      }
      setMeId(data.user.id)
    }

    loadMe()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadMe()
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const ch = supabase
      .channel(`follow_counts:${profileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_follows', filter: `following_id=eq.${profileId}` },
        () => void refreshCounts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_follows', filter: `follower_id=eq.${profileId}` },
        () => void refreshCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [profileId, refreshCounts])

  return (
    <div className="mt-6">
      {/* full-width divider inside the card (match mockup) */}
      <div className="-mx-4 border-t border-neutral-200/80 pt-4 sm:-mx-5">
        <div className="grid grid-cols-2 items-end gap-4 px-4 sm:px-5">
          {/* counts (stick to RIGHT side of the card in RTL) */}
          <div className="flex items-end justify-end gap-6 sm:gap-10">
            <Link
              href={`/u/${username}/followers`}
              className="group inline-flex flex-col items-center justify-center cursor-pointer select-none transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-2xl font-bold leading-none transition group-hover:opacity-90">
                {followersCount}
              </span>
              <span className="mt-1 text-xs text-muted-foreground transition group-hover:text-neutral-700">
                עוקבים
              </span>
            </Link>

            <Link
              href={`/u/${username}/following`}
              className="group inline-flex flex-col items-center justify-center cursor-pointer select-none transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-2xl font-bold leading-none transition group-hover:opacity-90">
                {followingCount}
              </span>
              <span className="mt-1 text-xs text-muted-foreground transition group-hover:text-neutral-700">
                עוקב אחרי
              </span>
            </Link>
          </div>

          {/* actions (stick to LEFT side of the card) */}
          <div className="flex items-center justify-start gap-3 sm:gap-4">
            {/* ✅ לא מציגים פעולות על עצמי / לא מחובר */}
            {isMe || !isAuthed ? null : (
              <>
                <FollowButton targetUserId={profileId} targetUsername={username} />
                <ProfileNonOwnerActions profileId={profileId} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
