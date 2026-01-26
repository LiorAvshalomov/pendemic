import { NextResponse } from "next/server"

// Admin API responses should never be cached by the browser/CDN.
export const ADMIN_NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
}

type JsonInit = {
  status?: number
  headers?: Record<string, string>
}

function mergeHeaders(headers?: Record<string, string>) {
  return { ...ADMIN_NO_STORE_HEADERS, ...(headers ?? {}) }
}

export function adminOk<T extends Record<string, unknown>>(body: T, init: JsonInit = {}) {
  return NextResponse.json(
    { ok: true, ...body },
    {
      status: init.status ?? 200,
      headers: mergeHeaders(init.headers),
    }
  )
}

export function adminError(
  message: string,
  status = 500,
  code = "error",
  extra?: Record<string, unknown>,
  init: JsonInit = {}
) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
      ...(extra ?? {}),
    },
    {
      status,
      headers: mergeHeaders(init.headers),
    }
  )
}
