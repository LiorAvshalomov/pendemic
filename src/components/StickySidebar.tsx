'use client'

import * as React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * Sidebar behavior (stable + predictable):
 * - Natural position in the layout (no JS pinning / no jumping).
 * - On desktop (lg+), it becomes sticky under the FIRST header row.
 *   This means it scrolls naturally until it reaches top-14, then stays fixed there.
 *
 * NOTE:
 * If you truly need "never move even 1px", that requires JS+fixed and will always
 * fight the layout (and it breaks the expectation of seeing more sidebar content
 * while scrolling the page). Sticky is the correct UX for "starts in place, then stays".
 */
export default function StickySidebar({ children, className }: Props) {
  return (
    <aside className={['self-start', className, 'lg:sticky lg:top-14'].filter(Boolean).join(' ')}>
      {children}
    </aside>
  )
}
