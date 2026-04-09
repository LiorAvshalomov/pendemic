import type { NextResponse } from 'next/server'

import type { HeaderUser } from '@/lib/auth/headerUser'

export const HEADER_USER_COOKIE = 'sb_hu'

const HEADER_USER_REMEMBER_TTL_S = 60 * 24 * 60 * 60
const HEADER_USER_SESSION_TTL_S = 24 * 60 * 60

type HeaderUserCookieClaims = {
  u: string
  n: string
  d: string
  a: string | null
  e: number
}

const enc = new TextEncoder()
const dec = new TextDecoder()

const BASE_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
} as const

function b64url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function fromB64url(value: string): Uint8Array<ArrayBuffer> {
  const padLen = (4 - (value.length % 4)) % 4
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen)
  const binary = atob(padded)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)

  for (let index = 0; index < binary.length; index += 1) {
    view[index] = binary.charCodeAt(index)
  }

  return view
}

async function importHmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

async function signPayload(payloadB64: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret, 'sign')
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64))
  return `${payloadB64}.${b64url(signature)}`
}

function normalizeHeaderUserCookieClaims(claims: HeaderUserCookieClaims): HeaderUser {
  const username = claims.n.trim()
  const displayName = claims.d.trim() || username || 'אנונימי'

  return {
    id: claims.u,
    username,
    displayName,
    avatarUrl: claims.a ?? null,
  }
}

export async function verifyHeaderUserCookie(
  cookieValue: string,
  secret: string,
): Promise<HeaderUser | null> {
  try {
    const lastDot = cookieValue.lastIndexOf('.')
    if (lastDot === -1) return null

    const payloadB64 = cookieValue.slice(0, lastDot)
    const signatureB64 = cookieValue.slice(lastDot + 1)

    const key = await importHmacKey(secret, 'verify')
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromB64url(signatureB64),
      enc.encode(payloadB64),
    )

    if (!valid) return null

    const claims = JSON.parse(dec.decode(fromB64url(payloadB64))) as HeaderUserCookieClaims
    if (
      !claims ||
      typeof claims.u !== 'string' ||
      typeof claims.n !== 'string' ||
      typeof claims.d !== 'string' ||
      (claims.a !== null && typeof claims.a !== 'string') ||
      typeof claims.e !== 'number'
    ) {
      return null
    }

    if (Math.floor(Date.now() / 1000) > claims.e) return null

    return normalizeHeaderUserCookieClaims(claims)
  } catch {
    return null
  }
}

export async function setHeaderUserCookie(
  res: NextResponse,
  user: HeaderUser | null,
  rememberMe = true,
): Promise<void> {
  const secret = process.env.PRESENCE_HMAC_SECRET
  if (!secret) return

  if (!user) {
    clearHeaderUserCookie(res)
    return
  }

  const maxAge = rememberMe ? HEADER_USER_REMEMBER_TTL_S : HEADER_USER_SESSION_TTL_S
  const exp = Math.floor(Date.now() / 1000) + maxAge
  const claims: HeaderUserCookieClaims = {
    u: user.id,
    n: user.username,
    d: user.displayName,
    a: user.avatarUrl,
    e: exp,
  }

  const payloadB64 = b64url(enc.encode(JSON.stringify(claims)))
  const token = await signPayload(payloadB64, secret)

  res.cookies.set({
    name: HEADER_USER_COOKIE,
    value: token,
    ...BASE_COOKIE_OPTS,
    maxAge,
  })
}

export function clearHeaderUserCookie(res: NextResponse): void {
  res.cookies.set({
    name: HEADER_USER_COOKIE,
    value: '',
    ...BASE_COOKIE_OPTS,
    maxAge: 0,
  })
}
