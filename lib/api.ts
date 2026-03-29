import {
  getServiceType, getRoom,
  offerWaitlistSpot,
  notificationEvents,
} from './mockStore'
import type { Studio, Session, Product, Entitlement, Booking, WaitlistEntry, NotificationEvent } from '@/types/domain'

// ========== STUDIOS ==========
export async function getStudios(): Promise<Studio[]> {
  const res = await fetch('/api/studios')
  if (!res.ok) throw new Error('Failed to load studios')
  const data = await res.json() as Array<Studio & { createdAt: string }>
  return data.map((s) => ({ ...s, createdAt: new Date(s.createdAt) }))
}

export async function getStudio(studioId: string): Promise<Studio | null> {
  const res = await fetch(`/api/studios/${studioId}`)
  if (!res.ok) return null
  const s = await res.json() as Studio & { createdAt: string }
  return { ...s, createdAt: new Date(s.createdAt) }
}

// ========== SERVICES ==========
export async function getServices(studioId: string) {
  const studio = await getStudio(studioId)
  return studio?.serviceTypes || []
}

// ========== SESSIONS ==========
export async function getSessions(filters?: { studioId?: string; date?: Date; serviceTypeId?: string }): Promise<Session[]> {
  const params = new URLSearchParams()
  if (filters?.studioId) params.set('studioId', filters.studioId)
  if (filters?.date) params.set('date', filters.date.toISOString())
  if (filters?.serviceTypeId) params.set('serviceTypeId', filters.serviceTypeId)
  const res = await fetch(`/api/sessions?${params}`)
  if (!res.ok) throw new Error('Failed to load sessions')
  const data = await res.json() as Array<Session & { date: string }>
  return data.map((s) => ({ ...s, date: new Date(s.date) }))
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const res = await fetch(`/api/sessions/${sessionId}`)
  if (!res.ok) return null
  const s = await res.json() as Session & { date: string }
  return { ...s, date: new Date(s.date) }
}

export async function getSessionDetails(sessionId: string) {
  const session = await getSession(sessionId)
  if (!session) return null
  const studio = await getStudio(session.studioId)
  const serviceType = studio?.serviceTypes.find((st) => st.id === session.serviceTypeId)
  const room = studio?.rooms.find((r) => r.id === session.roomId)
  return { session, studio, serviceType, room }
}

// ========== PRODUCTS ==========
export async function getProducts(studioId?: string): Promise<Product[]> {
  const params = studioId ? `?studioId=${studioId}` : ''
  const res = await fetch(`/api/products${params}`)
  if (!res.ok) throw new Error('Failed to load products')
  return res.json()
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

  const session = await getSession(booking.sessionId)
  const studio = session ? await getStudio(session.studioId) : undefined
  const serviceType = studio?.serviceTypes.find((st) => st.id === session?.serviceTypeId)

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
  if (!res.ok) return { error: data.error ?? 'Join waitlist failed' }
  return data as WaitlistEntry
}

export async function waitlistLeave(entryId: string) {
  const res = await fetch(`/api/waitlist/${entryId}`, { method: 'DELETE' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Leave waitlist failed')
  return data
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

const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms))

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
