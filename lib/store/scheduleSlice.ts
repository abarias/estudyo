import { StateCreator } from 'zustand'
import type { AppStore } from './index'
import type { Session } from '@/types/domain'
import * as api from '@/lib/api'
import { withDevSimulation } from './devSlice'

export interface ScheduleSlice {
  sessions: Session[]
  sessionsLoading: boolean
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  loadSessions: (filters?: { studioId?: string; date?: Date; serviceTypeId?: string }) => Promise<void>
  getSession: (id: string) => Session | undefined
  updateSessionOptimistic: (sessionId: string, updates: Partial<Session>) => void
}

export const createScheduleSlice: StateCreator<AppStore, [], [], ScheduleSlice> = (set, get) => ({
  sessions: [],
  sessionsLoading: false,
  selectedDate: (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })(),

  setSelectedDate: (date) => set({ selectedDate: date }),

  loadSessions: async (filters) => {
    set({ sessionsLoading: true })
    try {
      const sessions = await withDevSimulation(get(), () => api.getSessions(filters))
      set({ sessions, sessionsLoading: false })
    } catch {
      set({ sessionsLoading: false })
    }
  },

  getSession: (id) => get().sessions.find((s) => s.id === id),

  updateSessionOptimistic: (sessionId, updates) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }))
  },
})
