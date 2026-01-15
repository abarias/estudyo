import { StateCreator } from 'zustand'
import type { AppStore } from './index'
import type { NotificationEvent } from '@/types/domain'
import * as api from '@/lib/api'
import { withDevSimulation } from './devSlice'

export interface NotificationsSlice {
  notifications: NotificationEvent[]
  notificationsLoading: boolean
  loadNotifications: () => Promise<void>
}

export const createNotificationsSlice: StateCreator<AppStore, [], [], NotificationsSlice> = (set, get) => ({
  notifications: [],
  notificationsLoading: false,

  loadNotifications: async () => {
    set({ notificationsLoading: true })
    try {
      const notifications = await withDevSimulation(get(), () => api.getNotifications('user-1'))
      set({ notifications, notificationsLoading: false })
    } catch {
      set({ notificationsLoading: false })
    }
  },
})
