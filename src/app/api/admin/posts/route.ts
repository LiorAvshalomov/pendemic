import type { NextRequest } from "next/server"
import { requireAdminFromRequest } from "@/lib/admin/requireAdminFromRequest"
import { adminError, adminOk } from "@/lib/admin/adminHttp"

const VALID_FILTERS = new Set(["all", "deleted", "active", "published", "draft"])

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req)
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const q = (url.searchParams.get("q") ?? "").trim()
  const rawFilter = (url.searchParams.get("filter") ?? "all").toLowerCase()
  const filter = VALID_FILTERS.has(rawFilter) ? rawFilter : "all"
  const rawLimit = parseInt(url.searchParams.get("limit") ?? "50", 10)
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 50, 1), 200)

  let query = auth.admin
    .from("posts")
    .select("id, author_id, title, slug, status, published_at, created_at, deleted_at, deleted_reason")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (filter === "deleted") query = query.not("deleted_at", "is", null)
  if (filter === "active") query = query.is("deleted_at", null)
  if (filter === "published") query = query.eq("status", "published").is("deleted_at", null)
  if (filter === "draft") query = query.neq("status", "published").is("deleted_at", null)

  if (q) {
    // search in title + slug
    query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`)
  }

  const { data: posts, error } = await query
  if (error) return adminError(error.message, 500, "db_error")

  const authorIds = Array.from(new Set((posts ?? []).map((p: any) => p.author_id).filter(Boolean)))
  const { data: profiles, error: profErr } = authorIds.length
    ? await auth.admin.from("profiles").select("id, username, display_name, avatar_url").in("id", authorIds)
    : { data: [] as any[], error: null }

  if (profErr) return adminError(profErr.message, 500, "db_error")

  const byId = new Map<string, any>()
  ;(profiles ?? []).forEach((p: any) => byId.set(p.id, p))

  const enriched = (posts ?? []).map((p: any) => ({ ...p, author_profile: byId.get(p.author_id) ?? null }))
  return adminOk({ posts: enriched })
}
