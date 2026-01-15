import {
  studios, sessions, products, currentUser,
  getUserEntitlements, getUserBookings, getServiceType, getRoom,
  bookSession, cancelBooking, joinWaitlist, acceptWaitlistOffer, offerWaitlistSpot,
  waitlistEntries, notificationEvents, addEntitlement,
} from './mockStore'
import type { Studio, Session, Product, Entitlement, Booking, WaitlistEntry, NotificationEvent } from '@/types/domain'

// Simulate network delay
const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms))

// ========== USER ==========
export async function getMe() {
  await delay(100)
  return currentUser
}

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
export async function getWallet(userId: string) {
  await delay()
  const ents = getUserEntitlements(userId)
  const totalCredits = ents.reduce((sum, e) => sum + e.remaining, 0)
  return { entitlements: ents, totalCredits }
}

export async function getEntitlements(userId: string): Promise<Entitlement[]> {
  await delay()
  return getUserEntitlements(userId)
}

// ========== BOOKINGS ==========
export async function book(userId: string, sessionId: string, entitlementId: string) {
  await delay(300)
  return bookSession(userId, sessionId, entitlementId)
}

export async function cancel(bookingId: string) {
  await delay(300)
  return cancelBooking(bookingId)
}

export async function getBookings(userId: string): Promise<Booking[]> {
  await delay()
  return getUserBookings(userId)
}

export async function getBookingWithSession(bookingId: string) {
  await delay()
  const booking = getUserBookings(currentUser.id).find(b => b.id === bookingId)
  if (!booking) return null
  
  const session = sessions.find(s => s.id === booking.sessionId)
  const serviceType = session ? getServiceType(session.serviceTypeId) : undefined
  const studio = session ? studios.find(s => s.id === session.studioId) : undefined
  
  return { booking, session, serviceType, studio }
}

// ========== WAITLIST ==========
export async function waitlistJoin(userId: string, sessionId: string) {
  await delay(300)
  return joinWaitlist(userId, sessionId)
}

export async function waitlistAccept(entryId: string, entitlementId: string) {
  await delay(300)
  return acceptWaitlistOffer(entryId, entitlementId)
}

export async function getWaitlistEntries(userId: string): Promise<WaitlistEntry[]> {
  await delay()
  return waitlistEntries.filter(w => w.userId === userId)
}

// ========== NOTIFICATIONS ==========
export async function getNotifications(userId: string): Promise<NotificationEvent[]> {
  await delay()
  return notificationEvents.filter(n => n.userId === userId).slice(-10).reverse()
}

// ========== OWNER APIs ==========
export async function getSessionAttendees(sessionId: string) {
  await delay()
  const sessionBookings = getUserBookings(currentUser.id) // In real app, get all bookings for session
  // Mock: return bookings for this session
  return sessionBookings.filter(b => b.sessionId === sessionId && b.status === 'CONFIRMED')
}

export async function ownerSimulateSlotOpened(sessionId: string) {
  await delay(300)
  return offerWaitlistSpot(sessionId)
}

export async function purchaseProduct(userId: string, productId: string) {
  await delay(500)
  const entitlement = addEntitlement(userId, productId)
  return { success: true, entitlement }
}
