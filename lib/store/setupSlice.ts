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
  timezone: string
  rooms: SetupRoom[]
  serviceTypes: SetupServiceType[]
  products: SetupProduct[]
  templates: SetupTemplate[]
  generateDays: 14 | 28
}

export interface SetupSlice {
  setup: SetupState
  setSetupStep: (step: number) => void
  updateSetupStudio: (data: Partial<Pick<SetupState, 'studioName' | 'studioAddress' | 'timezone'>>) => void
  addSetupRoom: (room: SetupRoom) => void
  removeSetupRoom: (id: string) => void
  addSetupServiceType: (st: SetupServiceType) => void
  removeSetupServiceType: (id: string) => void
  addSetupProduct: (product: SetupProduct) => void
  removeSetupProduct: (id: string) => void
  addSetupTemplate: (template: SetupTemplate) => void
  removeSetupTemplate: (id: string) => void
  setGenerateDays: (days: 14 | 28) => void
  resetSetup: () => void
  completeSetup: () => void
}

const initialSetup: SetupState = {
  step: 0,
  studioName: '',
  studioAddress: '',
  timezone: 'America/New_York',
  rooms: [],
  serviceTypes: [],
  products: [],
  templates: [],
  generateDays: 14,
}

let idCounter = 1000

export const createSetupSlice: StateCreator<AppStore, [], [], SetupSlice> = (set, get) => ({
  setup: { ...initialSetup },

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

  setGenerateDays: (days) =>
    set((state) => ({ setup: { ...state.setup, generateDays: days } })),

  resetSetup: () => set({ setup: { ...initialSetup } }),

  completeSetup: () => {
    const { setup } = get()
    const studioId = `studio-setup-${++idCounter}`

    // Build studio with service types and rooms
    const serviceTypes = setup.serviceTypes.map((st) => ({
      id: `st-${++idCounter}`,
      studioId,
      name: st.name,
      description: '',
      color: st.color,
      durationMinutes: st.durationMinutes,
    }))

    const rooms = setup.rooms.map((r) => ({
      id: `room-${++idCounter}`,
      studioId,
      name: r.name,
      capacity: r.capacity,
    }))

    const newStudio = {
      id: studioId,
      name: setup.studioName,
      description: 'Your new studio',
      address: setup.studioAddress,
      ownerId: 'owner-setup',
      serviceTypes,
      rooms,
      createdAt: new Date(),
    }

    // Add products
    const newProducts = setup.products.map((p) => ({
      id: `prod-${++idCounter}`,
      studioId,
      type: p.type,
      name: p.name,
      description: '',
      price: p.price,
      credits: p.credits,
      sessionCount: p.sessions,
      validDays: p.expiryDays || 30,
    }))

    // Generate sessions from templates
    const newSessions: Array<{
      id: string
      studioId: string
      serviceTypeId: string
      roomId: string
      instructorId: string
      date: Date
      startTime: string
      endTime: string
      capacity: number
      bookedCount: number
      waitlistCount: number
      status: 'SCHEDULED'
    }> = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    setup.templates.forEach((template) => {
      const serviceType = serviceTypes.find(
        (_, idx) => setup.serviceTypes[idx]?.id === template.serviceTypeId
      ) || serviceTypes[0]
      const room = rooms[0]
      if (!serviceType || !room) return

      for (let d = 0; d < setup.generateDays; d++) {
        const date = new Date(today)
        date.setDate(date.getDate() + d)
        const dayOfWeek = date.getDay()

        if (template.daysOfWeek.includes(dayOfWeek)) {
          const [h, m] = template.startTime.split(':').map(Number)
          const duration = setup.serviceTypes.find((s) => s.id === template.serviceTypeId)?.durationMinutes || 60
          const endH = h + Math.floor((m + duration) / 60)
          const endM = (m + duration) % 60

          newSessions.push({
            id: `session-${++idCounter}`,
            studioId,
            serviceTypeId: serviceType.id,
            roomId: room.id,
            instructorId: 'instructor-1',
            date,
            startTime: template.startTime,
            endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
            capacity: template.capacityOverride || room.capacity,
            bookedCount: 0,
            waitlistCount: 0,
            status: 'SCHEDULED',
          })
        }
      }
    })

    // Update store
    set((state) => ({
      studios: [...state.studios, newStudio],
      products: [...state.products, ...newProducts],
      sessions: [...state.sessions, ...newSessions],
      setup: { ...initialSetup },
    }))
  },
})
