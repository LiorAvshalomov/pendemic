import type { NextRequest } from "next/server"
import { requireAdminFromRequest } from "@/lib/admin/requireAdminFromRequest"
import { adminError, adminOk } from "@/lib/admin/adminHttp"

const MAX_REASON_LEN = 500

export async function POST(req: NextRequest) {
  const auth = await requireAdminFromRequest(req)
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => ({} as any))
  const postId = (body?.post_id ?? "").toString().trim()
  const reason = (body?.reason ?? "").toString().trim()

  if (!postId) return adminError("Missing post_id", 400, "bad_request")
  if (!reason || reason.length < 3) return adminError("חייבים לציין סיבה (לפחות 3 תווים).", 400, "bad_request")
  if (reason.length > MAX_REASON_LEN) return adminError("הסיבה ארוכה מדי.", 400, "bad_request")

  // Load post (to know author + title)
  const { data: post, error: postErr } = await auth.admin
    .from("posts")
    .select("id, author_id, title, slug, deleted_at")
    .eq("id", postId)
    .maybeSingle()

  if (postErr) return adminError(postErr.message, 500, "db_error")
  if (!post) return adminError("Post not found", 404, "not_found")
  if (post.deleted_at) return adminError("הפוסט כבר נמחק (soft delete).", 400, "bad_request")

  const now = new Date().toISOString()

  // Soft delete
  const { error: updErr } = await auth.admin
    .from("posts")
    .update({ deleted_at: now, deleted_by: auth.user.id, deleted_reason: reason })
    .eq("id", postId)

  if (updErr) return adminError(updErr.message, 500, "db_error")

  // Notify post author
  const payload = {
    post_id: post.id,
    post_title: post.title,
    post_slug: post.slug,
    reason,
  }

  const { error: notifErr } = await auth.admin.from("notifications").insert({
    user_id: post.author_id,
    actor_id: null,
    type: "post_deleted",
    entity_type: "post",
    entity_id: post.id,
    payload,
    is_read: false,
    created_at: now,
  })

  if (notifErr) {
    // Post was deleted already - but we want to surface the problem
    return adminOk({ warning: `Post deleted, but notification failed: ${notifErr.message}` })
  }

  // Audit log (optional table; safe if missing)
  try {
    await auth.admin.from("moderation_actions").insert({
      actor_id: auth.user.id,
      target_user_id: post.author_id,
      post_id: post.id,
      action: "post_deleted",
      reason,
      created_at: now,
    })
  } catch {
    // ignore
  }

  return adminOk({})
}
