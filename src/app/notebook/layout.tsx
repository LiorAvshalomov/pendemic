import RequireAuth from '@/components/auth/RequireAuth'

export default function NotebookLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
