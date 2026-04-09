import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { fetchHeaderUserById, type HeaderUser } from '@/lib/auth/headerUser'
import { HEADER_USER_COOKIE, verifyHeaderUserCookie } from '@/lib/auth/headerUserCookie'
import { AUTH_HINT_COOKIE, verifyAuthHint } from '@/lib/auth/presenceCookie'

export async function resolveInitialHeaderUser(): Promise<HeaderUser | null> {
  const secret = process.env.PRESENCE_HMAC_SECRET
  if (!secret) return null

  const cookieStore = await cookies()
  const authHintValue = cookieStore.get(AUTH_HINT_COOKIE)?.value ?? ''
  if (!authHintValue) return null

  const authHint = await verifyAuthHint(authHintValue, secret)
  if (!authHint?.uid) return null

  const headerCookieValue = cookieStore.get(HEADER_USER_COOKIE)?.value ?? ''
  if (headerCookieValue) {
    const headerUser = await verifyHeaderUserCookie(headerCookieValue, secret)
    if (headerUser?.id === authHint.uid) {
      return headerUser
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) return null

  const serviceClient = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  })

  return fetchHeaderUserById(serviceClient, authHint.uid)
}
