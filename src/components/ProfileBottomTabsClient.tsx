'use client'

import { useState } from 'react'
import ProfilePostsClient from '@/components/ProfilePostsClient'
import ProfileStatsCard, { type ProfileReactionTotal } from '@/components/ProfileStatsCard'

type Tab = 'posts' | 'stats'

export default function ProfileBottomTabsClient({
  profileId,
  username,
  postsCount,
  commentsWritten,
  commentsReceived,
  medals,
  reactionTotals,
}: {
  profileId: string
  username: string
  postsCount: number
  commentsWritten: number
  commentsReceived: number
  medals: { gold: number; silver: number; bronze: number }
  reactionTotals?: ProfileReactionTotal[]
}) {
  const [tab, setTab] = useState<Tab>('posts')

  return (
    <section className="mt-6" dir="rtl">
      <div className="rounded-3xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{tab === 'posts' ? 'פוסטים' : 'נתונים'}</h2>

          <div className="inline-flex items-center gap-2 rounded-full border bg-white p-1">
            <button
              type="button"
              onClick={() => setTab('posts')}
              className={`rounded-full px-4 py-1.5 text-sm ${
                tab === 'posts' ? 'bg-neutral-900 text-white' : 'bg-transparent'
              }`}
            >
              פוסטים
            </button>
            <button
              type="button"
              onClick={() => setTab('stats')}
              className={`rounded-full px-4 py-1.5 text-sm ${
                tab === 'stats' ? 'bg-neutral-900 text-white' : 'bg-transparent'
              }`}
            >
              נתונים
            </button>
          </div>
        </div>

        {tab === 'posts' ? (
          <ProfilePostsClient profileId={profileId} username={username} />
        ) : (
          <div className="mt-2">
            <ProfileStatsCard
              postsCount={postsCount}
              commentsWritten={commentsWritten}
              commentsReceived={commentsReceived}
              medals={medals}
              reactionTotals={reactionTotals ?? []}
            />
          </div>
        )}
      </div>
    </section>
  )
}
