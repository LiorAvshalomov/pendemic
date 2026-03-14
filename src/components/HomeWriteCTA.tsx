'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type AuthState = 'loading' | 'guest' | 'authed'

export default function HomeWriteCTA() {
  const [state, setState] = useState<AuthState>('loading')

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        setState('guest')
        return
      }
      setState(data.session ? 'authed' : 'guest')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? 'authed' : 'guest')
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (state !== 'guest') return null

  return (
    <div className="tyuta-cta-card rounded-2xl p-5">
      <div className="font-black text-[15px] mb-1.5 tracking-tight">רוצה לכתוב?</div>
      <div className="text-xs text-muted-foreground leading-relaxed mb-4">הצטרף לקהילה ושתף את הסיפורים שלך</div>
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
      >
        התחל לכתוב
      </Link>
    </div>
  )
}
