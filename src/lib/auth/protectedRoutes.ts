const PROTECTED_PREFIXES = [
  '/write',
  '/saved',
  '/notifications',
  '/settings',
  '/trash',
  '/notes',
  '/notebook',
  '/inbox',
] as const

const ENTRY_AUTH_PREFIXES = ['/auth/login', '/auth/register', '/auth/signup', '/login', '/register'] as const

const ALL_AUTH_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/login',
  '/register',
] as const

const LOGIN_REDIRECT_PENDING_KEY = 'tyuta:auth:login-redirect'

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function isEntryAuthPath(pathname: string): boolean {
  return ENTRY_AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isAuthPath(pathname: string): boolean {
  return ALL_AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function buildLoginRedirect(pathname: string): string {
  const qs = new URLSearchParams()
  qs.set('next', pathname)
  return `/auth/login?${qs.toString()}`
}

function getCurrentPathWithSearch(): string | null {
  if (typeof window === 'undefined') return null
  return `${window.location.pathname}${window.location.search}`
}

export function shouldRunLoginRedirect(target: string): boolean {
  if (typeof window === 'undefined') return true

  const current = getCurrentPathWithSearch()
  if (current === target) return false

  try {
    const pending = window.sessionStorage.getItem(LOGIN_REDIRECT_PENDING_KEY)
    if (pending === target) return false
    window.sessionStorage.setItem(LOGIN_REDIRECT_PENDING_KEY, target)
  } catch {
    // ignore sessionStorage failures and allow the redirect
  }

  return true
}

export function syncLoginRedirectState(): void {
  if (typeof window === 'undefined') return

  try {
    const pending = window.sessionStorage.getItem(LOGIN_REDIRECT_PENDING_KEY)
    if (!pending) return

    const current = getCurrentPathWithSearch()
    if (!current) return

    if (current === pending || isAuthPath(window.location.pathname) || !isProtectedPath(window.location.pathname)) {
      window.sessionStorage.removeItem(LOGIN_REDIRECT_PENDING_KEY)
    }
  } catch {
    // ignore sessionStorage failures
  }
}

export function getSafePostAuthRedirect(rawNext: string | null, fallback = '/'): string {
  // Reject empty, non-relative, protocol-relative (//), and backslash-bypass (/\ → // in browsers)
  if (!rawNext || !rawNext.startsWith('/') || rawNext.startsWith('//') || rawNext.includes('\\')) return fallback
  if (isAuthPath(rawNext)) return fallback
  return rawNext
}
