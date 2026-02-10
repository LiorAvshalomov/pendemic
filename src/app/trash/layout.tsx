import RequireAuth from '@/components/auth/RequireAuth'

export default function TrashLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
