import RequireAuth from '@/components/auth/RequireAuth'

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
