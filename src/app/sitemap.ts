import { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

export const revalidate = 3600 // שעה

type SitemapPostRow = {
  slug: string
  author_id: string
  published_at: string | null
  updated_at: string | null
}

type SitemapProfileRow = {
  id: string
  username: string | null
  updated_at: string | null
}

function pickLastModified(p: { published_at: string | null; updated_at: string | null }): string | undefined {
  return (p.published_at ?? p.updated_at) ?? undefined
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tyuta.net"
  const nowIso = new Date().toISOString()

  // 1) Published posts only (public content)
  const { data: postsData, error: postsErr } = await supabase
    .from("posts")
    .select("slug,author_id,published_at,updated_at")
    .is("deleted_at", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })

  if (postsErr) {
    // Keep sitemap alive even if DB fails
    return [{ url: baseUrl, lastModified: nowIso, changeFrequency: "daily", priority: 1 }]
  }

  const posts = (postsData ?? []) as SitemapPostRow[]

  const postUrls: MetadataRoute.Sitemap = posts
    .filter((p) => typeof p.slug === "string" && p.slug.trim().length > 0)
    .map((p) => ({
      url: `${baseUrl}/post/${p.slug}`,
      lastModified: pickLastModified(p),
      changeFrequency: "weekly",
      priority: 0.8,
    }))

  // 2) Build authorId -> lastModified map from public posts (so we only include profiles that matter)
  const authorLast: Record<string, string> = {}
  for (const p of posts) {
    if (!p.author_id) continue
    const lm = pickLastModified(p)
    if (!lm) continue
    const prev = authorLast[p.author_id]
    if (!prev || new Date(lm).getTime() > new Date(prev).getTime()) {
      authorLast[p.author_id] = lm
    }
  }

  const authorIds = Object.keys(authorLast)

  // If no public posts, no public profiles in sitemap
  let profileUrls: MetadataRoute.Sitemap = []

  if (authorIds.length > 0) {
    // Pull only the profiles that have published posts
    const { data: profilesData, error: profilesErr } = await supabase
      .from("profiles")
      .select("id,username,updated_at")
      .in("id", authorIds)

    if (!profilesErr) {
      const profiles = (profilesData ?? []) as SitemapProfileRow[]

      profileUrls = profiles
        .filter((p) => typeof p.username === "string" && p.username.trim().length > 0)
        .map((p) => {
          const username = (p.username ?? "").trim()
          const postLm = authorLast[p.id]
          const profileLm = p.updated_at ?? undefined

          let lastModified: string | undefined = postLm ?? profileLm
          if (postLm && profileLm) {
            lastModified = new Date(postLm).getTime() > new Date(profileLm).getTime() ? postLm : profileLm
          }

          return {
            url: `${baseUrl}/u/${encodeURIComponent(username)}`,
            lastModified,
            changeFrequency: "weekly",
            priority: 0.6,
          }
        })
    }
  }

  return [
    { url: baseUrl, lastModified: nowIso, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.2 },
    ...postUrls,
    ...profileUrls,
  ]
}
