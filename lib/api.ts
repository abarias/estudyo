import {
  studios, sessions, products,
  getServiceType, getRoom,
  offerWaitlistSpot,
  notificationEvents,
} from './mockStore'
import type { Studio, Session, Product, Entitlement, Booking, WaitlistEntry, NotificationEvent } from '@/types/domain'

// Simulate network delay (used for mock-only calls)
const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms))

// ========== STUDIOS ==========
export async function getStudios(): Promise<Studio[]> {
  await delay()
  return studios
}

export async function getStudio(studioId: string): Promise<Studio | null> {
  await delay()
  return studios.find(s => s.id === studioId) || null
}

// ========== SERVICES ==========
export async function getServices(studioId: string) {
  await delay()
  const studio = studios.find(s => s.id === studioId)
  return studio?.serviceTypes || []
}

// ========== SESSIONS ==========
export async function getSessions(filters?: { studioId?: string; date?: Date; serviceTypeId?: string }): Promise<Session[]> {
  await delay()
  let result = [...sessions]

  if (filters?.studioId) {
    result = result.filter(s => s.studioId === filters.studioId)
  }
  if (filters?.date) {
    const filterDate = filters.date.toDateString()
    result = result.filter(s => s.date.toDateString() === filterDate)
  }
  if (filters?.serviceTypeId) {
    result = result.filter(s => s.serviceTypeId === filters.serviceTypeId)
  }

  return result.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime()
    return a.startTime.localeCompare(b.startTime)
  })
}

export async function getSession(sessionId: string): Promise<Session | null> {
  await delay()
  return sessions.find(s => s.id === sessionId) || null
}

export async function getSessionDetails(sessionId: string) {
  await delay()
  const session = sessions.find(s => s.id === sessionId)
  if (!session) return null

  const studio = studios.find(s => s.id === session.studioId)
  const serviceType = getServiceType(session.serviceTypeId)
  const room = getRoom(session.studioId, session.roomId)

  return { session, studio, serviceType, room }
}

// ========== PRODUCTS ==========
export async function getProducts(studioId?: string): Promise<Product[]> {
  await delay()
  if (studioId) return products.filter(p => p.studioId === studioId)
  return products
}

// ========== WALLET & ENTITLEMENTS ==========
export async function getWallet(_userId: string) {
  const res = await fetch('/api/wallet')
  if (!res.ok) throw new Error('Failed to fetch wallet')
  return res.json() as Promise<{ entitlements: Entitlement[]; totalCredits: number }>
}

export async function getEntitlements(_userId: string): Promise<Entitlement[]> {
  const { entitlements } = await getWallet(_userId)
  return entitlements
}

// ========== BOOKINGS ==========
export async function book(_userId: string, sessionId: string, entitlementId: string) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, entitlementId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Booking failed')
  return data as Booking
}

export async function cancel(bookingId: string) {
  const res = await fetch(`/api/bookings/${bookingId}`, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Cancel failed')
  return data
}

export async function getBookings(_userId: string): Promise<Booking[]> {
  const res = await fetch('/api/bookings')
  if (!res.ok) throw new Error('Failed to fetch bookings')
  return res.json()
}

export async function getBookingWithSession(bookingId: string) {
  const bookings = await getBookings('')
  const booking = bookings.find(b => b.id === bookingId)
  if (!booking) return null

  const session = sessions.find(s => s.id === booking.sessionId)
  const serviceType = session ? getServiceType(session.serviceTypeId) : undefined
  const studio = session ? studios.find(s => s.id === session.studioId) : undefined

  return { booking, session, serviceType, studio }
}

// ========== WAITLIST ==========
export async function waitlistJoin(_userId: string, sessionId: string) {
  const res = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Join waitlist failed')
  return data as WaitlistEntry
}

export async function waitlistAccept(entryId: string, entitlementId: string) {
  const res = await fetch(`/api/waitlist/${entryId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entitlementId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Accept offer failed')
  return data as Booking
}

export async function getWaitlistEntries(_userId: string): Promise<WaitlistEntry[]> {
  const res = await fetch('/api/waitlist')
  if (!res.ok) throw new Error('Failed to fetch waitlist')
  return res.json()
}

// ========== NOTIFICATIONS ==========
export async function getNotifications(userId: string): Promise<NotificationEvent[]> {
  await delay()
  return notificationEvents.filter(n => n.userId === userId).slice(-10).reverse()
}

// ========== OWNER APIs ==========
export async function getSessionAttendees(sessionId: string) {
  const bookings = await getBookings('')
  return bookings.filter(b => b.sessionId === sessionId && b.status === 'CONFIRMED')
}

export async function ownerSimulateSlotOpened(sessionId: string) {
  await delay(300)
  return offerWaitlistSpot(sessionId)
}

export async function purchaseProduct(_userId: string, productId: string) {
  const res = await fetch('/api/wallet/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Purchase failed')
  return data as { success: boolean; entitlement: Entitlement }
}
