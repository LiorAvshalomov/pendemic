export default function Loading() {
  return (
    <div dir="rtl" className="animate-pulse mx-auto max-w-2xl px-4 py-6 space-y-5">

      {/* ── FollowPageHeader ── */}
      <div className="bg-neutral-900/80 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Back button pill */}
        <div className="bg-neutral-800/70 h-8 w-32 rounded-full" />
        {/* Profile info: avatar FIRST (→ RIGHT in RTL) + name/username/medals SECOND */}
        <div className="flex items-center gap-4">
          <div className="bg-neutral-800/70 w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="bg-neutral-800/70 h-6 w-36 rounded-lg" />
            <div className="bg-neutral-800/70 h-4 w-24 rounded-lg" />
            <div className="flex gap-2">
              <div className="bg-neutral-800/70 h-6 w-14 rounded-full" />
              <div className="bg-neutral-800/70 h-6 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section title (naturally right-aligned in RTL) ── */}
      <div className="bg-neutral-800/70 h-6 w-28 rounded-lg" />

      {/* ── User card grid: 1 col → sm: 2 col ── */}
      {/* Each card: avatar FIRST (→ RIGHT), text middle, follow button LAST (→ LEFT) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-neutral-900/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="bg-neutral-800/70 w-14 h-14 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="bg-neutral-800/70 h-5 w-28 rounded-lg" />
              <div className="bg-neutral-800/70 h-4 w-20 rounded-lg" />
              <div className="bg-neutral-800/70 h-4 w-16 rounded-full" />
            </div>
            <div className="bg-neutral-800/70 h-9 w-20 rounded-full shrink-0" />
          </div>
        ))}
      </div>

    </div>
  )
}
