import type { NextResponse } from 'next/server'

export const ANALYTICS_SESSION_COOKIE = 'pd_sid'
export const ANALYTICS_SESSION_MAX_AGE_S = 60 * 60 * 24 * 30
export const ANALYTICS_SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000
export const ANALYTICS_AUTH_BACKFILL_WINDOW_MS = 2 * 60 * 1000

const BASE_ANALYTICS_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
} as const

export function setAnalyticsSessionCookie(res: NextResponse, sessionId: string): void {
  res.cookies.set({
    name: ANALYTICS_SESSION_COOKIE,
    value: sessionId,
    ...BASE_ANALYTICS_SESSION_COOKIE_OPTIONS,
    maxAge: ANALYTICS_SESSION_MAX_AGE_S,
  })
}

export function clearAnalyticsSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: ANALYTICS_SESSION_COOKIE,
    value: '',
    ...BASE_ANALYTICS_SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  })
}
