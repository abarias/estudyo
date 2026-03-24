import type { StateCreator } from 'zustand'

export interface AuthSlice {
  userId: string
  userName: string | null
  userEmail: string | null
  userImage: string | null
  setUser: (user: { id: string; name?: string | null; email?: string | null; image?: string | null }) => void
  clearUser: () => void
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  userId: 'user-1', // default guest id for demo mode
  userName: null,
  userEmail: null,
  userImage: null,
  setUser: (user) =>
    set({
      userId: user.id,
      userName: user.name ?? null,
      userEmail: user.email ?? null,
      userImage: user.image ?? null,
    }),
  clearUser: () =>
    set({
      userId: 'user-1',
      userName: null,
      userEmail: null,
      userImage: null,
    }),
})
