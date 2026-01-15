import { StateCreator } from 'zustand'
import type { AppStore } from './index'
import type { Studio, ServiceType } from '@/types/domain'
import * as api from '@/lib/api'
import { withDevSimulation } from './devSlice'

export interface CatalogSlice {
  studios: Studio[]
  studiosLoading: boolean
  loadStudios: () => Promise<void>
  getStudio: (id: string) => Studio | undefined
  getServiceType: (studioId: string, serviceTypeId: string) => ServiceType | undefined
}

export const createCatalogSlice: StateCreator<AppStore, [], [], CatalogSlice> = (set, get) => ({
  studios: [],
  studiosLoading: false,

  loadStudios: async () => {
    set({ studiosLoading: true })
    try {
      const studios = await withDevSimulation(get(), () => api.getStudios())
      set({ studios, studiosLoading: false })
    } catch {
      set({ studiosLoading: false })
    }
  },

  getStudio: (id) => get().studios.find((s) => s.id === id),

  getServiceType: (studioId, serviceTypeId) => {
    const studio = get().studios.find((s) => s.id === studioId)
    return studio?.serviceTypes.find((st) => st.id === serviceTypeId)
  },
})
