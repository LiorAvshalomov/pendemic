'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { waitForClientSession } from '@/lib/auth/clientSession'
import { buildLoginRedirect, shouldRunLoginRedirect } from '@/lib/auth/protectedRoutes'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const redirectToLogin = () => {
      const loginTarget = buildLoginRedirect('/admin')
      if (shouldRunLoginRedirect(loginTarget)) {
        router.replace(loginTarget)
      }
    }

    const checkAdmin = async (accessToken: string) => {
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (cancelled) return
      if (res.status === 401) {
        redirectToLogin()
        return
      }
      if (!res.ok) {
        router.replace('/')
        return
      }
      setOk(true)
    }

    const run = async () => {
      const resolution = await waitForClientSession(8000)
      if (cancelled) return

      if (resolution.status === 'unauthenticated') {
        redirectToLogin()
        return
      }

      if (resolution.status === 'authenticated' && resolution.session.access_token) {
        await checkAdmin(resolution.session.access_token)
        return
      }

      // Unknown / timed-out auth state: fail closed without advertising the admin area.
      router.replace('/')
    }

    void run().catch(() => {
      if (!cancelled) router.replace('/')
    })

    return () => {
      cancelled = true
    }
  }, [router])

  if (ok !== true) return null

  return <>{children}</>
}
