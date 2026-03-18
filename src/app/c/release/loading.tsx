export default function Loading() {
  return (
    <main dir="rtl">
      <div className="animate-pulse mx-auto max-w-6xl px-4 py-8 sm:py-10 space-y-6">

        {/* Channel header — right-aligned in RTL (items-start = physical RIGHT) */}
        <div className="flex flex-col items-start gap-1.5">
          <div className="bg-neutral-800/70 h-8 w-20 rounded-lg" />
          <div className="bg-neutral-800/70 h-4 w-44 rounded-lg" />
        </div>

        {/* ══════════════════════════════════════════════
            MOBILE (< lg): vertical stack of full-width
            post cards. Image TOP, content BELOW.
            ══════════════════════════════════════════════ */}
        <div className="lg:hidden space-y-4">

          {/* Card 1 — hero */}
          <div className="rounded-2xl overflow-hidden bg-neutral-900/80">
            <div className="bg-neutral-800/70 aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
              {/* Author: avatar+name FIRST (→ RIGHT), medal LAST (→ LEFT) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-neutral-800/70 h-8 w-8 rounded-full shrink-0" />
                  <div className="bg-neutral-800/70 h-4 w-16 rounded-lg" />
                </div>
                <div className="bg-neutral-800/70 h-5 w-10 rounded-full shrink-0" />
              </div>
              <div className="bg-neutral-800/70 h-3.5 w-4/5 rounded-lg" />
              <div className="bg-neutral-800/70 h-6 w-16 rounded-full" />
              <div className="space-y-2">
                <div className="bg-neutral-800/70 h-7 w-full rounded-lg" />
                <div className="bg-neutral-800/70 h-7 w-3/4 rounded-lg" />
              </div>
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
            DESKTOP (lg+): hero + 3-col grid + two-col
            ══════════════════════════════════════════════ */}

        {/* FeaturedPost hero — lg+ */}
        <div className="hidden lg:block relative h-[440px] rounded-2xl overflow-hidden">
          <div className="bg-neutral-800/70 absolute inset-0" />
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

        {/* 3-col card grid */}
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

        {/* Two-column: main (RIGHT) + sidebar (LEFT) */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="space-y-8">
            {[0, 1].map((section) => (
              <div key={section} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="bg-neutral-800/70 h-4 w-16 rounded-lg" />
                  <div className="bg-neutral-800/70 h-7 w-20 rounded-lg" />
                </div>
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
          <div className="flex flex-col gap-6">
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
