/**
 * Admin UI helpers.
 *
 * Admin API returns (by convention):
 *   success: { ok: true, ... }
 *   error:   { ok: false, error: { code: string, message: string }, ... }
 *
 * But older routes/components might still return `error: string`.
 */

export function getAdminErrorMessage(payload: any, fallback = "שגיאה"): string {
  const msg = payload?.error?.message
  if (typeof msg === "string" && msg.trim().length > 0) {
    return msg
  }

  const legacy = payload?.error
  if (typeof legacy === "string" && legacy.trim().length > 0) {
    return legacy
  }

  return fallback
}
