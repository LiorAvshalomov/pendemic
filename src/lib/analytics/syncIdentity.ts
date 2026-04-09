'use client'

type SyncAnalyticsIdentityOptions = {
  path?: string
  referrer?: string | null
}

export function syncAnalyticsIdentity(
  accessToken: string,
  options: SyncAnalyticsIdentityOptions = {},
): void {
  if (typeof window === 'undefined' || !accessToken) return
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') return

  const path = options.path ?? window.location.pathname
  const referrer = options.referrer ?? (document.referrer || null)

  void fetch('/api/internal/pv/identify', {
    method: 'POST',
    credentials: 'same-origin',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ path, referrer }),
  }).catch(() => {
    // Analytics identify is best-effort only.
  })
}
