import RequireAuth from '@/components/auth/RequireAuth'

export default function WriteLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
