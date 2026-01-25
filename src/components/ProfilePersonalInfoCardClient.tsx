'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ProfilePersonalInfoCard from '@/components/ProfilePersonalInfoCard'

type PersonalInfo = {
  personal_is_shared: boolean
  personal_about: string | null
  personal_age: number | null
  personal_occupation: string | null
  personal_writing_about: string | null
  personal_books: string | null
  personal_favorite_category: string | null
}

const LIMITS = {
  about: 90,
  occupation: 35,
  writingAbout: 35,
  books: 80,
  // Stored as one of: "פריקה" | "סיפורים" | "מגזין"
  favoriteCategory: 10,
}

function clampStr(v: string, max: number) {
  const s = (v ?? '').toString()
  return s.length > max ? s.slice(0, max) : s
}

function InputShell({
  label,
  hint,
  children,
  counter,
}: {
  label: string
  hint?: string
  counter?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        {counter ? <div className="text-xs text-muted-foreground">{counter}</div> : null}
      </div>
      {children}
    </div>
  )
}

export default function ProfilePersonalInfoCardClient({
  profileId,
  initial,
}: {
  profileId: string
  initial: PersonalInfo
}) {
  const [isOwner, setIsOwner] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [info, setInfo] = useState<PersonalInfo>(initial)

  // form fields
  const [isShared, setIsShared] = useState<boolean>(initial.personal_is_shared)
  const [about, setAbout] = useState<string>(initial.personal_about ?? '')
  const [age, setAge] = useState<string>(initial.personal_age?.toString() ?? '')
  const [occupation, setOccupation] = useState<string>(initial.personal_occupation ?? '')
  const [writingAbout, setWritingAbout] = useState<string>(initial.personal_writing_about ?? '')
  const [books, setBooks] = useState<string>(initial.personal_books ?? '')
  const [favoriteCategory, setFavoriteCategory] = useState<string>(
    initial.personal_favorite_category ?? ''
  )

  const favoriteCategoryOptions = useMemo(
    () => [
      { value: '', label: 'בחר' },
      { value: 'פריקה', label: 'פריקה' },
      { value: 'סיפורים', label: 'סיפורים' },
      { value: 'מגזין', label: 'מגזין' },
    ],
    []
  )

  useEffect(() => {
    let mounted = true

    const run = async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data?.user?.id
      if (!mounted) return
      setIsOwner(Boolean(uid && uid === profileId))
    }

    run()
    return () => {
      mounted = false
    }
  }, [profileId])

  const cardRight = useMemo(() => {
    if (isOwner) {
      return (
        <button
          type="button"
          onClick={() => {
            // reset form from current state
            setIsShared(info.personal_is_shared)
            setAbout(info.personal_about ?? '')
            setAge(info.personal_age?.toString() ?? '')
            setOccupation(info.personal_occupation ?? '')
            setWritingAbout(info.personal_writing_about ?? '')
            setBooks(info.personal_books ?? '')
            setFavoriteCategory(info.personal_favorite_category ?? '')
            setError(null)
            setOpen(true)
          }}
          className="text-xs font-semibold rounded-full border px-3 py-1 hover:bg-neutral-50"
        >
          עריכה
        </button>
      )
    }

    return !info.personal_is_shared ? (
      <span className="text-xs text-muted-foreground">פרטי</span>
    ) : null
  }, [info, isOwner])

  const save = async () => {
    setSaving(true)
    setError(null)

    const payload = {
      personal_is_shared: Boolean(isShared),
      personal_about: about.trim() ? clampStr(about.trim(), LIMITS.about) : null,
      personal_age: age.trim() ? Number(age) : null,
      personal_occupation: occupation.trim()
        ? clampStr(occupation.trim(), LIMITS.occupation)
        : null,
      personal_writing_about: writingAbout.trim()
        ? clampStr(writingAbout.trim(), LIMITS.writingAbout)
        : null,
      personal_books: books.trim() ? clampStr(books.trim(), LIMITS.books) : null,
      personal_favorite_category: favoriteCategory.trim()
        ? clampStr(favoriteCategory.trim(), LIMITS.favoriteCategory)
        : null,
      personal_updated_at: new Date().toISOString(),
    }

    // basic client-side validation
    if (payload.personal_age !== null) {
      if (Number.isNaN(payload.personal_age) || payload.personal_age < 0 || payload.personal_age > 150) {
        setSaving(false)
        setError('גיל חייב להיות מספר בין 0 ל-150')
        return
      }
    }

    const { error: upErr } = await supabase.from('profiles').update(payload).eq('id', profileId)

    if (upErr) {
      setSaving(false)
      setError(upErr.message)
      return
    }

    setInfo(prev => ({
      ...prev,
      personal_is_shared: payload.personal_is_shared,
      personal_about: payload.personal_about,
      personal_age: payload.personal_age,
      personal_occupation: payload.personal_occupation,
      personal_writing_about: payload.personal_writing_about,
      personal_books: payload.personal_books,
      personal_favorite_category: payload.personal_favorite_category,
    }))

    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <ProfilePersonalInfoCard
        isShared={info.personal_is_shared}
        about={info.personal_about}
        age={info.personal_age}
        occupation={info.personal_occupation}
        writingAbout={info.personal_writing_about}
        books={info.personal_books}
        favoriteCategory={info.personal_favorite_category}
        rightSlot={cardRight}
      />

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => (saving ? null : setOpen(false))}
          />

          <div className="relative z-10 w-[min(720px,calc(100vw-32px))] rounded-3xl border bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">עריכת מידע אישי</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  אתה יכול לבחור לשתף או להסתיר את המידע. אם לא תשתף, עדיין יוצגו תיבות אחידות
                  עם "הכותב בחר לא להציג".
                </p>
              </div>

              <button
                type="button"
                className="rounded-full border px-3 py-1 text-sm hover:bg-neutral-50"
                onClick={() => (saving ? null : setOpen(false))}
              >
                סגור
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border bg-neutral-50 p-3">
              <div>
                <div className="text-sm font-semibold">שיתוף מידע אישי</div>
                <div className="text-xs text-muted-foreground">
                  אם כבוי — יופיע "הכותב בחר לא להציג" במקום הערכים.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShared(v => !v)}
                className={`rounded-full px-4 py-2 text-sm font-semibold border ${
                  isShared ? 'bg-neutral-900 text-white' : 'bg-white'
                }`}
              >
                {isShared ? 'משותף' : 'פרטי'}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <InputShell
                  label="קצת עליי"
                  hint="מקסימום 90 תווים"
                  counter={`${about.length}/${LIMITS.about}`}
                >
                  <textarea
                    className="w-full rounded-2xl border p-3 text-sm leading-6"
                    rows={3}
                    maxLength={LIMITS.about}
                    value={about}
                    onChange={e => setAbout(e.target.value)}
                    placeholder="כתוב קצת על עצמך…"
                  />
                </InputShell>
              </div>

              <InputShell label="גיל" hint="מספר בלבד">
                <input
                  className="w-full rounded-2xl border p-3 text-sm"
                  inputMode="numeric"
                  value={age}
                  onChange={e => setAge(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="למשל 24"
                />
              </InputShell>

              <InputShell
                label="עיסוק"
                hint="מקסימום 35 תווים"
                counter={`${occupation.length}/${LIMITS.occupation}`}
              >
                <input
                  className="w-full rounded-2xl border p-3 text-sm"
                  maxLength={LIMITS.occupation}
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  placeholder="למשל סטודנט / מפתח / כותב…"
                />
              </InputShell>

              <InputShell
                label="אוהב לכתוב על"
                hint="מקסימום 35 תווים"
                counter={`${writingAbout.length}/${LIMITS.writingAbout}`}
              >
                <input
                  className="w-full rounded-2xl border p-3 text-sm"
                  maxLength={LIMITS.writingAbout}
                  value={writingAbout}
                  onChange={e => setWritingAbout(e.target.value)}
                  placeholder="למשל אהבה, חרדות, טכנולוגיה…"
                />
              </InputShell>

              <InputShell
                label="קטגוריה מועדפת"
                hint="בחר אחת משלוש קטגוריות"
              >
                <select
                  className="w-full rounded-2xl border p-3 text-sm bg-white"
                  value={favoriteCategory}
                  onChange={e => setFavoriteCategory(e.target.value)}
                >
                  {favoriteCategoryOptions.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </InputShell>

              <div className="md:col-span-2">
                <InputShell
                  label="ספרים שקראתי"
                  hint="מקסימום 80 תווים"
                  counter={`${books.length}/${LIMITS.books}`}
                >
                  <textarea
                    className="w-full rounded-2xl border p-3 text-sm leading-6"
                    rows={2}
                    maxLength={LIMITS.books}
                    value={books}
                    onChange={e => setBooks(e.target.value)}
                    placeholder="שמות ספרים / סופרים…"
                  />
                </InputShell>
              </div>
            </div>

            {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
                disabled={saving}
                onClick={() => setOpen(false)}
              >
                ביטול
              </button>
              <button
                type="button"
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={saving}
                onClick={save}
              >
                {saving ? 'שומר…' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
