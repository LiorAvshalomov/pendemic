import React from 'react'

type Props = {
  header?: React.ReactNode
  actions?: React.ReactNode
  sidebar?: React.ReactNode
  /** תוכן הפוסט עצמו (לב האתר) */
  children: React.ReactNode
  /** בלוקים מתחת לתוכן (תגובות/תחושות וכו') – לא בתוך כרטיס התוכן */
  below?: React.ReactNode
}

/**
 * עוטף לעמוד פוסט: תוכן מימין + סיידבר משמאל (בדסקטופ), RTL-first.
 * שומר על קריאות גבוהה (מדד קריאה) ועל הרבה "אוויר".
 */
export default function PostShell({ header, actions, sidebar, children, below }: Props) {
  return (
    <main className="min-h-screen bg-neutral-50" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {/*
          חשוב: בדסקטופ אנחנו רוצים שהטקסט (המאמר) יהיה בצד ימין והסיידבר בצד שמאל.
          עם RTL + flex זה קל להתבלבל, לכן אנחנו משתמשים ב-grid וקובעים עמודות מפורשות.
        */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* סיידבר – משמאל */}
          {sidebar ? (
            <aside className="order-2 w-full lg:order-1 lg:col-start-1 lg:row-start-1 lg:w-[360px] lg:shrink-0">
              <div className="lg:sticky lg:top-24">{sidebar}</div>
            </aside>
          ) : null}

          {/* תוכן – מימין */}
          <article className="order-1 min-w-0 rounded-3xl bg-white shadow-sm ring-1 ring-black/5 lg:order-2 lg:col-start-2 lg:row-start-1">
            {(header || actions) ? (
              <header className="px-6 pt-7 sm:px-10 sm:pt-9">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-right">{header}</div>
                  {actions ? <div className="shrink-0">{actions}</div> : null}
                </div>
              </header>
            ) : null}

            <section className="px-6 pb-7 pt-2 text-right sm:px-10 sm:pb-10">
              <div className="max-w-[72ch]">{children}</div>
            </section>
          </article>
        </div>

        {/* בלוקים מתחת לתוכן (באותו רוחב/עמודה של התוכן) */}
        {below ? (
          <>
            {sidebar ? <div className="hidden lg:block lg:col-start-1 lg:row-start-2" /> : null}
            <div className="order-3 min-w-0 lg:col-start-2 lg:row-start-2">
              {below}
            </div>
          </>
        ) : null}
        
      </div>
    </main>
  )
}
