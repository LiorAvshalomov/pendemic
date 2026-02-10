import RequireAuth from '@/components/auth/RequireAuth'

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
