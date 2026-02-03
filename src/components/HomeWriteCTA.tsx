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
    <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
      <div className="font-black text-sm mb-1">רוצה לכתוב?</div>
      <div className="text-xs text-gray-600 mb-3">הצטרף לקהילה ושתף את הסיפורים שלך</div>
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-xl bg-black text-white px-4 py-2 text-sm font-bold hover:opacity-90"
      >
        התחל לכתוב
      </Link>
    </div>
  )
}
