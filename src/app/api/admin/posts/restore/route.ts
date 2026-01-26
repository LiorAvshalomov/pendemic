import type { NextRequest } from "next/server"
import { requireAdminFromRequest } from "@/lib/admin/requireAdminFromRequest"
import { adminError, adminOk } from "@/lib/admin/adminHttp"

export async function POST(req: NextRequest) {
  const auth = await requireAdminFromRequest(req)
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => ({} as any))
  const postId = (body?.post_id ?? "").toString().trim()
  if (!postId) return adminError("Missing post_id", 400, "bad_request")

  const { error } = await auth.admin
    .from("posts")
    .update({ deleted_at: null, deleted_by: null, deleted_reason: null })
    .eq("id", postId)

  if (error) return adminError(error.message, 500, "db_error")
  return adminOk({})
}
