import { StateCreator } from 'zustand'
import type { AppStore } from './index'
import type { Booking, WaitlistEntry } from '@/types/domain'
import * as api from '@/lib/api'
import { withDevSimulation } from './devSlice'

type PendingOperation = {
  type: 'book' | 'cancel' | 'waitlist-join' | 'waitlist-accept'
  id: string
  status: 'pending' | 'success' | 'error'
  error?: string
}

export interface BookingSlice {
  bookings: Booking[]
  waitlistEntries: WaitlistEntry[]
  bookingsLoading: boolean
  pendingOperations: PendingOperation[]
  loadBookings: () => Promise<void>
  loadWaitlist: () => Promise<void>
  bookSession: (sessionId: string, entitlementId: string) => Promise<boolean>
  cancelBooking: (bookingId: string) => Promise<boolean>
  joinWaitlist: (sessionId: string) => Promise<true | string>
  leaveWaitlist: (entryId: string, sessionId: string) => Promise<boolean>
  acceptWaitlistOffer: (entryId: string, entitlementId: string) => Promise<boolean>
  addPendingOperation: (op: PendingOperation) => void
  updatePendingOperation: (id: string, status: PendingOperation['status'], error?: string) => void
  removePendingOperation: (id: string) => void
}

export const createBookingSlice: StateCreator<AppStore, [], [], BookingSlice> = (set, get) => ({
  bookings: [],
  waitlistEntries: [],
  bookingsLoading: false,
  pendingOperations: [],

  loadBookings: async () => {
    set({ bookingsLoading: true })
    try {
      const bookings = await withDevSimulation(get(), () => api.getBookings(get().userId))
      set({ bookings, bookingsLoading: false })
    } catch {
      set({ bookingsLoading: false })
    }
  },

  loadWaitlist: async () => {
    try {
      const waitlistEntries = await withDevSimulation(get(), () => api.getWaitlistEntries(get().userId))
      set({ waitlistEntries })
    } catch {
      // ignore
    }
  },

  bookSession: async (sessionId, entitlementId) => {
    const opId = `book-${sessionId}-${Date.now()}`
    const session = get().getSession(sessionId)

    if (!session) return false

    const entitlement = entitlementId ? get().entitlements.find((e) => e.id === entitlementId) : null

    // Optimistic update
    get().addPendingOperation({ type: 'book', id: opId, status: 'pending' })
    get().updateSessionOptimistic(sessionId, { bookedCount: session.bookedCount + 1 })
    if (entitlement) {
      get().updateEntitlementOptimistic(entitlementId, { remaining: entitlement.remaining - 1 })
    }

    try {
      const result = await withDevSimulation(get(), () => api.book(get().userId, sessionId, entitlementId))

      if ('error' in result) {
        // Rollback
        get().updateSessionOptimistic(sessionId, { bookedCount: session.bookedCount })
        if (entitlement) {
          get().updateEntitlementOptimistic(entitlementId, { remaining: entitlement.remaining })
        }
        get().updatePendingOperation(opId, 'error', result.error as string)
        setTimeout(() => get().removePendingOperation(opId), 3000)
        return false
      }

      // Refresh data
      await Promise.all([get().loadBookings(), get().loadWallet()])
      get().updatePendingOperation(opId, 'success')
      setTimeout(() => get().removePendingOperation(opId), 1000)
      return true
    } catch (e) {
      // Rollback
      get().updateSessionOptimistic(sessionId, { bookedCount: session.bookedCount })
      if (entitlement) {
        get().updateEntitlementOptimistic(entitlementId, { remaining: entitlement.remaining })
      }
      const msg = e instanceof Error ? e.message : 'Network error'
      get().updatePendingOperation(opId, 'error', msg)
      setTimeout(() => get().removePendingOperation(opId), 3000)
      return false
    }
  },

  cancelBooking: async (bookingId) => {
    const opId = `cancel-${bookingId}-${Date.now()}`
    const booking = get().bookings.find((b) => b.id === bookingId)
    if (!booking) return false

    const session = get().getSession(booking.sessionId)

    // Optimistic update
    get().addPendingOperation({ type: 'cancel', id: opId, status: 'pending' })
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b
      ),
    }))
    if (session) {
      get().updateSessionOptimistic(session.id, { bookedCount: session.bookedCount - 1 })
    }

    try {
      const result = await withDevSimulation(get(), () => api.cancel(bookingId))
      
      if (!result.success) {
        // Rollback
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'CONFIRMED' as const } : b
          ),
        }))
        if (session) {
          get().updateSessionOptimistic(session.id, { bookedCount: session.bookedCount })
        }
        get().updatePendingOperation(opId, 'error', result.error)
        setTimeout(() => get().removePendingOperation(opId), 3000)
        return false
      }

      await Promise.all([get().loadBookings(), get().loadWallet()])
      get().updatePendingOperation(opId, 'success')
      setTimeout(() => get().removePendingOperation(opId), 1000)
      return true
    } catch {
      // Rollback
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'CONFIRMED' as const } : b
        ),
      }))
      if (session) {
        get().updateSessionOptimistic(session.id, { bookedCount: session.bookedCount })
      }
      get().updatePendingOperation(opId, 'error', 'Network error')
      setTimeout(() => get().removePendingOperation(opId), 3000)
      return false
    }
  },

  joinWaitlist: async (sessionId) => {
    const opId = `waitlist-${sessionId}-${Date.now()}`
    const session = get().getSession(sessionId)

    get().addPendingOperation({ type: 'waitlist-join', id: opId, status: 'pending' })
    if (session) {
      get().updateSessionOptimistic(sessionId, { waitlistCount: session.waitlistCount + 1 })
    }

    try {
      const result = await withDevSimulation(get(), () => api.waitlistJoin(get().userId, sessionId))
      
      if ('error' in result) {
        if (session) {
          get().updateSessionOptimistic(sessionId, { waitlistCount: session.waitlistCount })
        }
        const msg = result.error as string
        get().updatePendingOperation(opId, 'error', msg)
        setTimeout(() => get().removePendingOperation(opId), 3000)
        return msg
      }

      await get().loadWaitlist()
      get().updatePendingOperation(opId, 'success')
      setTimeout(() => get().removePendingOperation(opId), 1000)
      return true
    } catch {
      if (session) {
        get().updateSessionOptimistic(sessionId, { waitlistCount: session.waitlistCount })
      }
      get().updatePendingOperation(opId, 'error', 'Network error')
      setTimeout(() => get().removePendingOperation(opId), 3000)
      return 'Network error'
    }
  },

  leaveWaitlist: async (entryId, sessionId) => {
    const session = get().getSession(sessionId)
    if (session) {
      get().updateSessionOptimistic(sessionId, { waitlistCount: Math.max(0, session.waitlistCount - 1) })
    }
    set((state) => ({
      waitlistEntries: state.waitlistEntries.filter((e) => e.id !== entryId),
    }))
    try {
      await api.waitlistLeave(entryId)
      return true
    } catch {
      // Roll back
      if (session) get().updateSessionOptimistic(sessionId, { waitlistCount: session.waitlistCount })
      await get().loadWaitlist()
      return false
    }
  },

  acceptWaitlistOffer: async (entryId, entitlementId) => {
    const opId = `accept-${entryId}-${Date.now()}`
    const entry = get().waitlistEntries.find((e) => e.id === entryId)
    const entitlement = get().entitlements.find((e) => e.id === entitlementId)

    if (!entry || !entitlement) return false

    get().addPendingOperation({ type: 'waitlist-accept', id: opId, status: 'pending' })
    
    // Optimistic: mark as accepted, decrement credits
    set((state) => ({
      waitlistEntries: state.waitlistEntries.map((w) =>
        w.id === entryId ? { ...w, status: 'ACCEPTED' as const } : w
      ),
    }))
    get().updateEntitlementOptimistic(entitlementId, { remaining: entitlement.remaining - 1 })

    try {
      const result = await withDevSimulation(get(), () => api.waitlistAccept(entryId, entitlementId))
      
      if ('error' in result) {
        // Rollback
        set((state) => ({
          waitlistEntries: state.waitlistEntries.map((w) =>
            w.id === entryId ? { ...w, status: 'OFFERED' as const } : w
          ),
        }))
        get().updateEntitlementOptimistic(entitlementId, { remaining: entitlement.remaining })
        get().updatePendingOperation(opId, 'error', result.error as string)
        setTimeout(() => get().removePendingOperation(opId), 3000)
        return false
      }

      await Promise.all([get().loadBookings(), get().loadWaitlist(), get().loadWallet()])
      get().updatePendingOperation(opId, 'success')
      setTimeout(() => get().removePendingOperation(opId), 1000)
      return true
    } catch {
      // Rollback
      set((state) => ({
        waitlistEntries: state.waitlistEntries.map((w) =>
          w.id === entryId ? { ...w, status: 'OFFERED' as const } : w
        ),
      }))
      get().updateEntitlementOptimistic(entitlementId, { remaining: entitlement.remaining })
      get().updatePendingOperation(opId, 'error', 'Network error')
      setTimeout(() => get().removePendingOperation(opId), 3000)
      return false
    }
  },

  addPendingOperation: (op) => {
    set((state) => ({ pendingOperations: [...state.pendingOperations, op] }))
  },

  updatePendingOperation: (id, status, error) => {
    set((state) => ({
      pendingOperations: state.pendingOperations.map((op) =>
        op.id === id ? { ...op, status, error } : op
      ),
    }))
  },

  removePendingOperation: (id) => {
    set((state) => ({
      pendingOperations: state.pendingOperations.filter((op) => op.id !== id),
    }))
  },
})
