import { StateCreator } from 'zustand'
import type { AppStore } from './index'

export interface SetupRoom {
  id: string
  name: string
  capacity: number
}

export interface SetupServiceType {
  id: string
  name: string
  durationMinutes: number
  defaultCapacity: number
  color: 'sage' | 'clay' | 'blush' | 'sky'
}

export interface SetupProduct {
  id: string
  type: 'SINGLE_SESSION' | 'CREDIT_PACK' | 'PACKAGE'
  name: string
  price: number
  credits?: number
  sessions?: number
  expiryDays?: number
}

export interface SetupTemplate {
  id: string
  serviceTypeId: string
  daysOfWeek: number[]
  startTime: string
  instructorName?: string
  capacityOverride?: number
}

export interface SetupState {
  step: number
  studioName: string
  studioAddress: string
  coordLat: number | null
  coordLng: number | null
  timezone: string
  waitlistEnabled: boolean
  rooms: SetupRoom[]
  serviceTypes: SetupServiceType[]
  products: SetupProduct[]
  templates: SetupTemplate[]
  instructorIds: string[]
  generateDays: 14 | 28
}

export interface SetupSlice {
  setup: SetupState
  studioTemplates: Record<string, SetupTemplate[]>
  setSetupStep: (step: number) => void
  updateSetupStudio: (data: Partial<Pick<SetupState, 'studioName' | 'studioAddress' | 'coordLat' | 'coordLng' | 'timezone' | 'waitlistEnabled'>>) => void
  addSetupRoom: (room: SetupRoom) => void
  removeSetupRoom: (id: string) => void
  addSetupServiceType: (st: SetupServiceType) => void
  removeSetupServiceType: (id: string) => void
  addSetupProduct: (product: SetupProduct) => void
  removeSetupProduct: (id: string) => void
  addSetupTemplate: (template: SetupTemplate) => void
  removeSetupTemplate: (id: string) => void
  setSetupInstructors: (ids: string[]) => void
  setGenerateDays: (days: 14 | 28) => void
  resetSetup: () => void
  completeSetup: () => Promise<void>
  generateSessionsForStudio: (studioId: string, startDate: Date, days: number) => Promise<number>
}

const initialSetup: SetupState = {
  step: 0,
  studioName: '',
  studioAddress: '',
  coordLat: null,
  coordLng: null,
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  waitlistEnabled: true,
  rooms: [],
  serviceTypes: [],
  products: [],
  templates: [],
  instructorIds: [],
  generateDays: 14,
}

let idCounter = 1000

export const createSetupSlice: StateCreator<AppStore, [], [], SetupSlice> = (set, get) => ({
  setup: { ...initialSetup },
  studioTemplates: {},

  setSetupStep: (step) => set((state) => ({ setup: { ...state.setup, step } })),

  updateSetupStudio: (data) =>
    set((state) => ({ setup: { ...state.setup, ...data } })),

  addSetupRoom: (room) =>
    set((state) => ({ setup: { ...state.setup, rooms: [...state.setup.rooms, room] } })),

  removeSetupRoom: (id) =>
    set((state) => ({
      setup: { ...state.setup, rooms: state.setup.rooms.filter((r) => r.id !== id) },
    })),

  addSetupServiceType: (st) =>
    set((state) => ({
      setup: { ...state.setup, serviceTypes: [...state.setup.serviceTypes, st] },
    })),

  removeSetupServiceType: (id) =>
    set((state) => ({
      setup: { ...state.setup, serviceTypes: state.setup.serviceTypes.filter((s) => s.id !== id) },
    })),

  addSetupProduct: (product) =>
    set((state) => ({
      setup: { ...state.setup, products: [...state.setup.products, product] },
    })),

  removeSetupProduct: (id) =>
    set((state) => ({
      setup: { ...state.setup, products: state.setup.products.filter((p) => p.id !== id) },
    })),

  addSetupTemplate: (template) =>
    set((state) => ({
      setup: { ...state.setup, templates: [...state.setup.templates, template] },
    })),

  removeSetupTemplate: (id) =>
    set((state) => ({
      setup: { ...state.setup, templates: state.setup.templates.filter((t) => t.id !== id) },
    })),

  setSetupInstructors: (ids) =>
    set((state) => ({ setup: { ...state.setup, instructorIds: ids } })),

  setGenerateDays: (days) =>
    set((state) => ({ setup: { ...state.setup, generateDays: days } })),

  resetSetup: () => set({ setup: { ...initialSetup } }),

  completeSetup: async () => {
    const { setup } = get()
    const res = await fetch('/api/owner/studios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: setup.studioName,
        address: setup.studioAddress,
        coordLat: setup.coordLat,
        coordLng: setup.coordLng,
        timezone: setup.timezone,
        waitlistEnabled: setup.waitlistEnabled,
        rooms: setup.rooms,
        serviceTypes: setup.serviceTypes,
        products: setup.products,
        templates: setup.templates,
        instructorIds: setup.instructorIds,
        generateDays: setup.generateDays,
      }),
    })
    if (!res.ok) throw new Error('Studio setup failed')
    set({ setup: { ...initialSetup } })
  },

  generateSessionsForStudio: async (studioId, startDate, days) => {
    const res = await fetch(`/api/owner/studios/${studioId}/generate-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: startDate.toISOString(), days }),
    })
    if (!res.ok) return 0
    const { count } = await res.json()
    return count as number
  },
})
