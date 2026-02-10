"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  children: React.ReactNode
  unauthRedirectTo?: string
}

export default function RequireAuth({ children, unauthRedirectTo = '/auth/login' }: Props) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const { data } = await supabase.auth.getSession()
      const ok = Boolean(data.session?.user?.id)
      if (!ok) {
        // Direct access to protected routes => login.
        // (Lost-session redirects are handled globally by <AuthSync />.)
        const qs = new URLSearchParams()
        // Keep return path for post-login UX (optional, no breaking changes).
        qs.set('next', pathname)
        router.replace(`${unauthRedirectTo}?${qs.toString()}`)
        return
      }

      if (!cancelled) setReady(true)
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [pathname, router, unauthRedirectTo])

  if (!ready) return null
  return <>{children}</>
}
