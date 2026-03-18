export default function Loading() {
  return (
    <main dir="rtl">
      <div className="animate-pulse mx-auto max-w-6xl px-4 py-8 sm:py-10 space-y-8">

        {/* ══════════════════════════════════════════════
            MOBILE (< lg): vertical stack of full-width
            post cards matching the actual card anatomy.
            Image FIRST in DOM → physically on top (xs).
            At sm: sm:order-2 pushes image to LEFT col.
            ══════════════════════════════════════════════ */}
        <div className="lg:hidden space-y-4">

          {/* Card 1 — hero / FeaturedPost */}
          <div className="rounded-2xl overflow-hidden bg-neutral-900/80">
            {/* Image FIRST → top on xs, LEFT col at sm (sm:order-2 in RTL grid) */}
            <div className="bg-neutral-800/70 aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
              {/* Author row: avatar+name FIRST (→ RIGHT), medal LAST (→ LEFT) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-neutral-800/70 h-8 w-8 rounded-full shrink-0" />
                  <div className="bg-neutral-800/70 h-4 w-16 rounded-lg" />
                </div>
                <div className="bg-neutral-800/70 h-5 w-10 rounded-full shrink-0" />
              </div>
              {/* Tags / metadata line */}
              <div className="bg-neutral-800/70 h-3.5 w-4/5 rounded-lg" />
              {/* Channel badge */}
              <div className="bg-neutral-800/70 h-6 w-16 rounded-full" />
              {/* Title */}
              <div className="space-y-2">
                <div className="bg-neutral-800/70 h-7 w-full rounded-lg" />
                <div className="bg-neutral-800/70 h-7 w-3/4 rounded-lg" />
              </div>
              {/* Excerpt */}
              <div className="space-y-1.5">
                <div className="bg-neutral-800/70 h-4 w-full rounded-lg" />
                <div className="bg-neutral-800/70 h-4 w-5/6 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Cards 2–4 */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-neutral-900/80">
              <div className="bg-neutral-800/70 aspect-[4/3] w-full" />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-neutral-800/70 h-8 w-8 rounded-full shrink-0" />
                    <div className="bg-neutral-800/70 h-4 w-16 rounded-lg" />
                  </div>
                  <div className="bg-neutral-800/70 h-5 w-10 rounded-full shrink-0" />
                </div>
                <div className="bg-neutral-800/70 h-3.5 w-4/5 rounded-lg" />
                <div className="space-y-2">
                  <div className="bg-neutral-800/70 h-6 w-full rounded-lg" />
                  <div className="bg-neutral-800/70 h-6 w-2/3 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <div className="bg-neutral-800/70 h-4 w-full rounded-lg" />
                  <div className="bg-neutral-800/70 h-4 w-4/5 rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-neutral-800/70 h-7 w-7 rounded-full shrink-0" />
                  <div className="bg-neutral-800/70 h-4 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            DESKTOP (lg+): full-bleed hero + 3-col grid
            + two-column main/sidebar layout.
            ══════════════════════════════════════════════ */}

        {/* FeaturedPost hero — lg+ */}
        <div className="hidden lg:block relative h-[440px] rounded-2xl overflow-hidden">
          <div className="bg-neutral-800/70 absolute inset-0" />
          {/* Text panel pinned to physical RIGHT (right-0, w-46%) */}
          <div className="absolute top-0 bottom-0 right-0 w-[46%] bg-neutral-900/90 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-neutral-800/70 h-10 w-10 rounded-full shrink-0" />
                <div className="bg-neutral-800/70 h-4 w-20 rounded-lg" />
              </div>
              <div className="bg-neutral-800/70 h-5 w-12 rounded-full shrink-0" />
            </div>
            <div className="bg-neutral-800/70 h-3.5 w-4/5 rounded-lg" />
            <div className="bg-neutral-800/70 h-5 w-20 rounded-full" />
            <div className="space-y-2">
              <div className="bg-neutral-800/70 h-8 w-full rounded-lg" />
              <div className="bg-neutral-800/70 h-8 w-4/5 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <div className="bg-neutral-800/70 h-4 w-full rounded-lg" />
              <div className="bg-neutral-800/70 h-4 w-3/4 rounded-lg" />
            </div>
          </div>
        </div>

        {/* 3-column SimplePostCard grid — lg: 3 col, sm: 2 col, xs: 1 col */}
        <div className="hidden lg:grid grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-neutral-900/80 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-neutral-800/70 aspect-[4/3] w-full" />
              <div className="p-4 flex flex-col gap-2">
                <div className="bg-neutral-800/70 h-5 w-4/5 rounded-lg" />
                <div className="bg-neutral-800/70 h-4 w-3/5 rounded-lg" />
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-neutral-800/70 h-6 w-6 rounded-full shrink-0" />
                  <div className="bg-neutral-800/70 h-4 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column: main 1fr (RIGHT in RTL) + sidebar 360px (LEFT) */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* Main: 3 channel sections (פריקה / סיפורים / מגזין) */}
          <div className="space-y-8">
            {[0, 1, 2].map((section) => (
              <div key={section} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="bg-neutral-800/70 h-4 w-16 rounded-lg" />
                  <div className="bg-neutral-800/70 h-7 w-20 rounded-lg" />
                </div>
                {/* ListRowCompact: flex-row-reverse → image LEFT (physical), text RIGHT */}
                {[0, 1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="flex flex-row-reverse items-stretch gap-4 bg-neutral-900/60 rounded-xl overflow-hidden"
                  >
                    <div className="bg-neutral-800/70 w-[168px] shrink-0 aspect-[4/3]" />
                    <div className="flex-1 p-3 flex flex-col gap-2 justify-center min-w-0">
                      <div className="bg-neutral-800/70 h-5 w-4/5 rounded-lg" />
                      <div className="bg-neutral-800/70 h-4 w-3/5 rounded-lg" />
                      <div className="flex items-center gap-2">
                        <div className="bg-neutral-800/70 h-6 w-6 rounded-full shrink-0" />
                        <div className="bg-neutral-800/70 h-4 w-20 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Recent posts (RecentMiniRow: flex-row-reverse, image 94px square) */}
            <div className="bg-neutral-900/60 rounded-2xl p-4 space-y-3">
              <div className="bg-neutral-800/70 h-5 w-28 rounded-lg" />
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-row-reverse items-stretch gap-3">
                  <div className="bg-neutral-800/70 w-[94px] aspect-square shrink-0 rounded-lg" />
                  <div className="flex-1 flex flex-col gap-1.5 justify-center min-w-0">
                    <div className="bg-neutral-800/70 h-4 w-full rounded-lg" />
                    <div className="bg-neutral-800/70 h-3.5 w-2/3 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
            {/* Top writers */}
            <div className="bg-neutral-900/60 rounded-2xl p-4 space-y-3">
              <div className="bg-neutral-800/70 h-5 w-32 rounded-lg" />
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="bg-neutral-800/70 h-4 w-16 rounded-lg" />
                  <div className="flex items-center gap-2">
                    <div className="bg-neutral-800/70 h-4 w-20 rounded-lg" />
                    <div className="bg-neutral-800/70 h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
