'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, Settings, BookOpen, LogOut, LogIn, CalendarDays, Building2 } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

function getNavItems(role: string) {
  switch (role) {
    case 'OWNER':
      return [
        { href: '/owner', label: 'Schedule', icon: CalendarDays },
        { href: '/owner/bookings', label: 'Bookings', icon: Calendar },
        { href: '/owner/studios', label: 'Studios', icon: Building2 },
      ]
    case 'INSTRUCTOR':
      return [
        { href: '/instructor/studios', label: 'Studios', icon: MapPin },
        { href: '/instructor', label: 'Schedule', icon: BookOpen },
      ]
    default: // CUSTOMER
      return [
        { href: '/studios', label: 'Studios', icon: MapPin },
        { href: '/bookings', label: 'Bookings', icon: Calendar },
      ]
  }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? 'CUSTOMER'
  const navItems = getNavItems(role)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href="/" className="text-lg font-bold text-text">
            Estudyo
          </Link>
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
            >
              {session.user.image && (
                <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
              )}
              <LogOut size={14} />
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-1 text-xs text-muted hover:text-text transition-colors">
              <LogIn size={14} />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border safe-area-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = (href === '/owner' || href === '/instructor')
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors
                  ${isActive ? 'text-sage' : 'text-muted'}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
