'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/lib/store'

/**
 * Syncs the NextAuth session user into the Zustand store so all slices
 * can access the real user ID instead of the hardcoded 'user-1' default.
 */
export default function SessionSync() {
  const { data: session, status } = useSession()
  const setUser = useStore((s) => s.setUser)
  const clearUser = useStore((s) => s.clearUser)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      })
    } else if (status === 'unauthenticated') {
      clearUser()
    }
  }, [status, session, setUser, clearUser])

  return null
}
