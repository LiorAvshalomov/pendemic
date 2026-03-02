/**
 * Convert a Supabase public storage URL into a local proxy URL.
 *
 * The proxy (src/app/api/media/cover/route.ts) re-serves the image with
 * `Cache-Control: public, max-age=31536000, immutable` so browsers and CDNs
 * cache covers for a full year (Supabase storage only sends max-age=3600).
 * Covers are served as-is (no Next.js Image Optimization transforms) so
 * `<Image unoptimized>` is used at the call sites.
 *
 * Non-Supabase URLs (Pixabay, Pexels, …) are returned unchanged so they
 * still resolve directly against their own CDNs.
 */
/** True when a src has already been routed through /api/media/cover (Supabase storage). */
export function isProxySrc(src: string | null | undefined): boolean {
  return (src ?? '').startsWith('/api/media/cover')
}

export function coverProxySrc(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = '/storage/v1/object/public/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url // external CDN — pass through
  const path = url.slice(idx + marker.length)
  return `/api/media/cover?path=${encodeURIComponent(path)}`
}
