import AppShell from '@/components/layout/AppShell'
import SessionSync from '@/components/SessionSync'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <SessionSync />
      {children}
    </AppShell>
  )
}
