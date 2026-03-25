import { StateCreator } from 'zustand'
import { addDays, addMinutes, addHours } from 'date-fns'
import type { AppStore } from './index'
import type { Session, Entitlement, Booking, WaitlistEntry, Studio, Product } from '@/types/domain'

export type ScenarioId = 1 | 2 | 3 | 4 | 5 | null

export interface ScenariosSlice {
  activeScenario: ScenarioId
  scenarioLoading: boolean
  loadScenario: (id: ScenarioId) => Promise<void>
  resetDemoData: () => void
}

const today = new Date()
today.setHours(0, 0, 0, 0)

// Base seed data for all scenarios
function getBaseStudios(): Studio[] {
  return [
    {
      id: 'studio-1',
      name: 'Galaw BGC',
      description: 'Premium movement studio in the heart of Bonifacio Global City.',
      address: '4F High Street South Corporate Plaza, BGC, Taguig',
      ownerId: 'owner-1',
      serviceTypes: [
        { id: 'st-1', studioId: 'studio-1', name: 'Mat Pilates', description: 'Core strength', color: 'sage', durationMinutes: 55 },
        { id: 'st-2', studioId: 'studio-1', name: 'Reformer Pilates', description: 'Machine training', color: 'clay', durationMinutes: 50 },
        { id: 'st-3', studioId: 'studio-1', name: 'Vinyasa Yoga', description: 'Dynamic flow', color: 'blush', durationMinutes: 60 },
      ],
      rooms: [
        { id: 'room-1', studioId: 'studio-1', name: 'Main Studio', capacity: 12 },
        { id: 'room-2', studioId: 'studio-1', name: 'Reformer Room', capacity: 6 },
      ],
      createdAt: new Date(),
    },
  ]
}

function getBaseProducts(): Product[] {
  return [
    { id: 'prod-1', studioId: 'studio-1', type: 'SINGLE_SESSION', name: 'Drop-in Class', description: 'Single pass', price: 750, validDays: 30 },
    { id: 'prod-2', studioId: 'studio-1', type: 'CREDIT_PACK', name: '5 Class Pack', description: 'Save 15%', price: 3200, credits: 5, validDays: 60 },
    { id: 'prod-3', studioId: 'studio-1', type: 'CREDIT_PACK', name: '10 Class Pack', description: 'Save 20%', price: 6000, credits: 10, validDays: 90 },
  ]
}

function generateBaseSessions(): Session[] {
  const sessions: Session[] = []
  const times = ['07:00', '09:00', '12:00', '17:00', '19:00']
  let id = 1

  for (let d = 0; d <= 5; d++) {
    const date = addDays(today, d)
    times.slice(0, 3 + (d % 2)).forEach((time, idx) => {
      sessions.push({
        id: `session-${id++}`,
        studioId: 'studio-1',
        serviceTypeId: `st-${(idx % 3) + 1}`,
        roomId: idx % 2 === 0 ? 'room-1' : 'room-2',
        instructorId: 'instructor-1',
        date,
        startTime: time,
        endTime: time.replace(/^\d+/, (h) => String(parseInt(h) + 1).padStart(2, '0')),
        capacity: idx % 2 === 0 ? 12 : 6,
        bookedCount: Math.floor(Math.random() * 6),
        waitlistCount: 0,
        status: 'SCHEDULED',
      })
    })
  }
  return sessions
}

// Scenario data generators
function scenario1Data() {
  return {
    studios: getBaseStudios(),
    products: getBaseProducts(),
    sessions: generateBaseSessions(),
    entitlements: [
      { id: 'ent-1', userId: 'user-1', type: 'CREDITS' as const, productId: 'prod-2', remaining: 5, serviceTypeIds: [], expiresAt: addDays(today, 60) },
    ],
    bookings: [] as Booking[],
    waitlistEntries: [] as WaitlistEntry[],
  }
}

function scenario2Data() {
  return {
    studios: getBaseStudios(),
    products: getBaseProducts(),
    sessions: generateBaseSessions(),
    entitlements: [] as Entitlement[],
    bookings: [] as Booking[],
    waitlistEntries: [] as WaitlistEntry[],
  }
}

function scenario3Data() {
  const sessions = generateBaseSessions()
  // Make first session full with waitlist
  sessions[0].bookedCount = sessions[0].capacity
  sessions[0].waitlistCount = 3

  return {
    studios: getBaseStudios(),
    products: getBaseProducts(),
    sessions,
    entitlements: [
      { id: 'ent-1', userId: 'user-1', type: 'CREDITS' as const, productId: 'prod-2', remaining: 3, serviceTypeIds: [], expiresAt: addDays(today, 60) },
    ],
    bookings: [] as Booking[],
    waitlistEntries: [
      { id: 'wl-1', userId: 'user-2', sessionId: 'session-1', status: 'WAITING' as const, position: 1, joinedAt: new Date() },
      { id: 'wl-2', userId: 'user-3', sessionId: 'session-1', status: 'WAITING' as const, position: 2, joinedAt: new Date() },
      { id: 'wl-3', userId: 'user-1', sessionId: 'session-1', status: 'WAITING' as const, position: 3, joinedAt: new Date() },
    ],
  }
}

function scenario4Data() {
  const sessions = generateBaseSessions()
  sessions[0].bookedCount = sessions[0].capacity
  sessions[0].waitlistCount = 1

  return {
    studios: getBaseStudios(),
    products: getBaseProducts(),
    sessions,
    entitlements: [
      { id: 'ent-1', userId: 'user-1', type: 'CREDITS' as const, productId: 'prod-2', remaining: 2, serviceTypeIds: [], expiresAt: addDays(today, 60) },
    ],
    bookings: [] as Booking[],
    waitlistEntries: [
      {
        id: 'wl-1',
        userId: 'user-1',
        sessionId: 'session-1',
        status: 'OFFERED' as const,
        position: 1,
        joinedAt: addMinutes(new Date(), -30),
        offeredAt: new Date(),
        offerExpiresAt: addMinutes(new Date(), 15),
      },
    ],
  }
}

function scenario5Data() {
  const sessions = generateBaseSessions()
  // Session in 2 hours (within 24h cancel window)
  const nearSession = {
    ...sessions[0],
    id: 'session-near',
    date: today,
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toTimeString().slice(0, 5),
    bookedCount: 5,
  }
  sessions.unshift(nearSession)

  return {
    studios: getBaseStudios(),
    products: getBaseProducts(),
    sessions,
    entitlements: [
      { id: 'ent-1', userId: 'user-1', type: 'CREDITS' as const, productId: 'prod-2', remaining: 4, serviceTypeIds: [], expiresAt: addDays(today, 60) },
    ],
    bookings: [
      { id: 'booking-1', userId: 'user-1', sessionId: 'session-near', status: 'CONFIRMED' as const, bookedAt: addHours(new Date(), -48), chargeId: 'charge-1' },
    ],
    waitlistEntries: [] as WaitlistEntry[],
  }
}

export const createScenariosSlice: StateCreator<AppStore, [], [], ScenariosSlice> = (set) => ({
  activeScenario: null,
  scenarioLoading: false,

  loadScenario: async (id) => {
    set({ scenarioLoading: true, activeScenario: id })

    // Simulate loading delay
    await new Promise((r) => setTimeout(r, 500))

    if (id === null) {
      set({ scenarioLoading: false })
      return
    }

    const scenarioData = {
      1: scenario1Data,
      2: scenario2Data,
      3: scenario3Data,
      4: scenario4Data,
      5: scenario5Data,
    }[id]()

    set({
      studios: scenarioData.studios,
      products: scenarioData.products,
      sessions: scenarioData.sessions,
      entitlements: scenarioData.entitlements,
      bookings: scenarioData.bookings,
      waitlistEntries: scenarioData.waitlistEntries,
      scenarioLoading: false,
    })
  },

  resetDemoData: () => {
    const data = scenario1Data()
    set({
      studios: data.studios,
      products: data.products,
      sessions: data.sessions,
      entitlements: data.entitlements,
      bookings: data.bookings,
      waitlistEntries: data.waitlistEntries,
      activeScenario: null,
    })
  },
})
