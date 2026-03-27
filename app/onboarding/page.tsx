'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { roleHome } from '@/lib/roles'

const roles = [
  {
    id: 'CUSTOMER',
    label: 'Student / Customer',
    description: 'I want to discover and book classes at studios.',
    icon: '🧘',
  },
  {
    id: 'OWNER',
    label: 'Studio Owner',
    description: 'I manage a studio and want to publish classes.',
    icon: '🏠',
  },
  {
    id: 'INSTRUCTOR',
    label: 'Instructor',
    description: 'I teach classes and want to manage my schedule.',
    icon: '🎓',
  },
]

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  // Already onboarded — redirect to role home
  if (status === 'authenticated' && session.user.onboarded) {
    router.replace(roleHome(session.user.role))
    return null
  }

  // Not signed in — redirect to landing
  if (status === 'unauthenticated') {
    router.replace('/')
    return null
  }

  const handleSelect = async (role: string) => {
    if (loading) return
    setSelected(role)
    setLoading(true)

    try {
      const res = await fetch('/api/user/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Failed to set role')

      // Force new JWT with updated role by re-authenticating
      const provider = session?.user?.provider ?? 'google'
      await signIn(provider, { callbackUrl: roleHome(role) })
    } catch {
      setLoading(false)
      setSelected(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-text">Welcome to Estudyo</h1>
          <p className="text-muted text-sm">How will you be using the app?</p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => {
            const isSelected = selected === role.id
            return (
              <button
                key={role.id}
                onClick={() => handleSelect(role.id)}
                disabled={loading}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-sage bg-sage/10'
                    : 'border-border bg-surface hover:border-sage/50'
                } ${loading && !isSelected ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{role.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-text text-sm">{role.label}</div>
                    <div className="text-muted text-xs mt-0.5">{role.description}</div>
                  </div>
                  {isSelected && loading && (
                    <div className="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted">
          You can change this later in your profile settings.
        </p>
      </div>
    </div>
  )
}
