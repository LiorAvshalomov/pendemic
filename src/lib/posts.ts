// src/lib/posts.ts

/**
 * A single source of truth for which timestamp should be used to display a post in public lists.
 *
 * Rules:
 * - If published_at exists -> use it (moment the post became public)
 * - Else -> fallback to created_at
 */
export function getPostDisplayDate(post: {
  published_at: string | null
  created_at: string
}): string {
  return post.published_at ?? post.created_at
}
