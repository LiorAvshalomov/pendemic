import React from 'react'

type Props = {
  about?: string | null
  age?: number | null
  occupation?: string | null
  writingAbout?: string | null
  books?: string | null
  favoriteCategory?: string | null
  /** Optional: if later you want a single privacy toggle */
  isShared?: boolean | null

  /** Optional: override the top-right control (e.g. "עריכה" button for owner) */
  rightSlot?: React.ReactNode
}

function Placeholder({ text }: { text: string }) {
  return <span className="text-sm text-muted-foreground">{text}</span>
}

function Row({
  label,
  value,
  placeholder,
}: {
  label: string
  value: React.ReactNode
  placeholder: string
}) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    (typeof value !== 'string' || value.trim().length > 0)

  return (
    <div className="rounded-2xl border bg-neutral-50 px-3 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 min-h-[20px]">
        {hasValue ? (
          <div className="text-sm text-neutral-900 break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
            {value}
          </div>
        ) : (
          <Placeholder text={placeholder} />
        )}
      </div>
    </div>
  )
}

export default function ProfilePersonalInfoCard({
  about,
  age,
  occupation,
  writingAbout,
  books,
  favoriteCategory,
  isShared,
  rightSlot,
}: Props) {
  const shared = Boolean(isShared)
  const placeholder = shared ? 'לא מולא' : 'הכותב בחר לא להציג'

  // Keep the layout consistent by capping what we render (even if DB allows longer).
  const aboutCapped = typeof about === 'string' ? about.slice(0, 90) : about
  const occupationCapped = typeof occupation === 'string' ? occupation.slice(0, 35) : occupation
  const writingAboutCapped =
    typeof writingAbout === 'string' ? writingAbout.slice(0, 35) : writingAbout
  const booksCapped = typeof books === 'string' ? books.slice(0, 80) : books

  // Note: for now we still show placeholders even if fields are missing in DB.
  // When you add real fields to `profiles`, just pass them as props from the profile page.

  return (
    <div
      className="rounded-2xl border bg-white p-4 h-[440px] flex flex-col overflow-hidden"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold m-0">מידע אישי</h3>
        {rightSlot ? rightSlot : !shared ? (
          <span className="text-xs text-muted-foreground">פרטי</span>
        ) : null}
      </div>

      {/* Keep fixed height card but allow scrolling inside so it never overflows into other sections */}
      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3">
          <Row label="קצת עליי" value={aboutCapped ?? ''} placeholder={placeholder} />
          <div className="grid grid-cols-2 gap-3">
            <Row label="גיל" value={age ?? ''} placeholder={placeholder} />
            <Row label="עיסוק" value={occupationCapped ?? ''} placeholder={placeholder} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Row
              label="אוהב לכתוב על"
              value={writingAboutCapped ?? ''}
              placeholder={placeholder}
            />
            <Row label="קטגוריה מועדפת" value={favoriteCategory ?? ''} placeholder={placeholder} />
          </div>
          <Row label="ספרים שקראתי" value={booksCapped ?? ''} placeholder={placeholder} />
        </div>
      </div>
    </div>
  )
}
