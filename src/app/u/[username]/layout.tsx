import type { ReactNode } from "react"

// All SEO metadata is handled in page.tsx via generateMetadata — same pattern as post/[slug].
export default function UserLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
