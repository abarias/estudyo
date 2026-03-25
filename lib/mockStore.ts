import { addDays, format, setHours, setMinutes } from 'date-fns'
import type {
  User, Studio, Room, ServiceType, Session, Product, 
  Entitlement, Booking, BookingCharge, WaitlistEntry, NotificationEvent,
  WaitlistStatus
} from '@/types/domain'

// ========== POLICY CONFIG ==========
export const POLICY = {
  cancelCutoffHours: 24,
  waitlistOfferWindowMinutes: 15,
  bookingCutoffMinutes: 60,
}

// ========== CURRENT USER (mock) ==========
export const currentUser: User = {
  id: 'user-1',
  email: 'demo@estudyo.app',
  name: 'Demo User',
  roles: ['CUSTOMER'],
  createdAt: new Date(),
}

// ========== SEED DATA ==========
const today = new Date()
today.setHours(0, 0, 0, 0)

// Service types seed
const serviceTypesSeed: ServiceType[] = [
  { id: 'st-1', studioId: 'studio-1', name: 'Mat Pilates', description: 'Core strength and flexibility', color: 'sage', durationMinutes: 55 },
  { id: 'st-2', studioId: 'studio-1', name: 'Reformer Pilates', description: 'Machine-based resistance training', color: 'clay', durationMinutes: 50 },
  { id: 'st-3', studioId: 'studio-1', name: 'Vinyasa Yoga', description: 'Dynamic flow yoga', color: 'blush', durationMinutes: 60 },
  { id: 'st-4', studioId: 'studio-2', name: 'Yin Yoga', description: 'Deep stretch and relaxation', color: 'sky', durationMinutes: 75 },
  { id: 'st-5', studioId: 'studio-2', name: 'Power Yoga', description: 'Strength-building yoga', color: 'sage', durationMinutes: 60 },
  { id: 'st-6', studioId: 'studio-2', name: 'Barre', description: 'Ballet-inspired toning and endurance', color: 'clay', durationMinutes: 55 },
]

// Studios with rooms
export const studios: Studio[] = [
  {
    id: 'studio-1',
    name: 'Galaw BGC',
    description: 'Premium movement studio in the heart of Bonifacio Global City.',
    address: '4F High Street South Corporate Plaza, BGC, Taguig',
    coordinates: { lat: 14.5503, lng: 121.0494 },
    ownerId: 'owner-1',
    serviceTypes: serviceTypesSeed.filter(st => st.studioId === 'studio-1'),
    rooms: [
      { id: 'room-1a', studioId: 'studio-1', name: 'Main Studio', capacity: 12 },
      { id: 'room-1b', studioId: 'studio-1', name: 'Reformer Room', capacity: 6 },
    ],
    createdAt: new Date(),
  },
  {
    id: 'studio-2',
    name: 'Anino Wellness',
    description: 'Your sanctuary for mindful movement in Ortigas.',
    address: '3F Estancia Mall, Capitol Commons, Pasig',
    coordinates: { lat: 14.5872, lng: 121.0716 },
    ownerId: 'owner-2',
    serviceTypes: serviceTypesSeed.filter(st => st.studioId === 'studio-2'),
    rooms: [
      { id: 'room-2a', studioId: 'studio-2', name: 'Yoga Hall', capacity: 15 },
      { id: 'room-2b', studioId: 'studio-2', name: 'Pilates Studio', capacity: 10 },
    ],
    createdAt: new Date(),
  },
]

// Generate sessions for next 6 days
function generateSessions(): Session[] {
  const sessions: Session[] = []
  const times = ['07:00', '09:00', '12:00', '17:00', '19:00']
  let sessionId = 1

  for (let dayOffset = 0; dayOffset <= 5; dayOffset++) {
    const date = addDays(today, dayOffset)
    
    studios.forEach(studio => {
      // 3-5 sessions per day per studio
      const dayTimes = times.slice(0, 3 + (dayOffset % 3))
      
      dayTimes.forEach((time, idx) => {
        const serviceType = studio.serviceTypes[idx % studio.serviceTypes.length]
        const room = studio.rooms[idx % studio.rooms.length]
        const [hours, mins] = time.split(':').map(Number)
        const endHour = hours + Math.floor((mins + serviceType.durationMinutes) / 60)
        const endMin = (mins + serviceType.durationMinutes) % 60
        
        // Ensure first session of today has waitlist for testing
        const isFirstTodaySession = dayOffset === 0 && idx === 0 && studio.id === 'studio-1'
        
        sessions.push({
          id: `session-${sessionId++}`,
          studioId: studio.id,
          serviceTypeId: serviceType.id,
          roomId: room.id,
          instructorId: `instructor-${(idx % 2) + 1}`,
          date,
          startTime: time,
          endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
          capacity: room.capacity,
          bookedCount: isFirstTodaySession ? room.capacity : Math.floor(Math.random() * (room.capacity - 2)),
          waitlistCount: isFirstTodaySession ? 1 : (Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0),
          status: 'SCHEDULED',
        })
      })
    })
  }
  
  return sessions
}

// Seed initial waitlist entries for the first session
function seedWaitlist(): WaitlistEntry[] {
  return [
    {
      id: 'waitlist-1',
      userId: 'user-1',
      sessionId: 'session-1',
      status: 'WAITING',
      position: 1,
      joinedAt: new Date(),
    },
  ]
}

// Products (prices in Philippine Peso)
export const products: Product[] = [
  { id: 'prod-1', studioId: 'studio-1', type: 'SINGLE_SESSION', name: 'Drop-in Class', description: 'Single session pass', price: 750, validDays: 30 },
  { id: 'prod-2', studioId: 'studio-1', type: 'CREDIT_PACK', name: '5 Class Pack', description: 'Save 15% on 5 classes', price: 3200, credits: 5, validDays: 60 },
  { id: 'prod-3', studioId: 'studio-1', type: 'CREDIT_PACK', name: '10 Class Pack', description: 'Save 20% on 10 classes', price: 6000, credits: 10, validDays: 90 },
  { id: 'prod-4', studioId: 'studio-2', type: 'SINGLE_SESSION', name: 'Drop-in Class', description: 'Single session pass', price: 650, validDays: 30 },
  { id: 'prod-5', studioId: 'studio-2', type: 'CREDIT_PACK', name: '5 Class Pack', description: 'Best value for regulars', price: 2750, credits: 5, validDays: 60 },
]

// Initial entitlements (wallet)
export let entitlements: Entitlement[] = [
  { id: 'ent-1', userId: 'user-1', type: 'CREDITS', productId: 'prod-2', remaining: 3, serviceTypeIds: [], expiresAt: addDays(today, 45) },
]

// Store arrays
export let sessions: Session[] = generateSessions()
export let bookings: Booking[] = []
export let bookingCharges: BookingCharge[] = []
export let waitlistEntries: WaitlistEntry[] = seedWaitlist()
export let notificationEvents: NotificationEvent[] = []

// ========== CORE OPERATIONS ==========
let idCounter = 100

function genId(prefix: string): string {
  return `${prefix}-${++idCounter}`
}

export function bookSession(userId: string, sessionId: string, entitlementId: string): { booking: Booking; charge: BookingCharge } | { error: string } {
  const session = sessions.find(s => s.id === sessionId)
  if (!session) return { error: 'Session not found' }
  
  const entitlement = entitlements.find(e => e.id === entitlementId && e.userId === userId)
  if (!entitlement || entitlement.remaining < 1) return { error: 'No valid entitlement' }
  
  if (session.bookedCount >= session.capacity) return { error: 'Session full' }
  
  // Create booking
  const booking: Booking = {
    id: genId('booking'),
    userId,
    sessionId,
    status: 'CONFIRMED',
    bookedAt: new Date(),
    chargeId: '',
  }
  
  const charge: BookingCharge = {
    id: genId('charge'),
    bookingId: booking.id,
    entitlementId,
    unitsUsed: 1,
  }
  
  booking.chargeId = charge.id
  
  // Update state
  entitlement.remaining -= 1
  session.bookedCount += 1
  bookings.push(booking)
  bookingCharges.push(charge)
  
  notificationEvents.push({
    id: genId('notif'),
    userId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed',
    message: `Your booking is confirmed for ${format(session.date, 'MMM d')} at ${session.startTime}`,
    read: false,
    createdAt: new Date(),
  })
  
  return { booking, charge }
}

export function cancelBooking(bookingId: string): { success: boolean; error?: string } {
  const booking = bookings.find(b => b.id === bookingId)
  if (!booking || booking.status !== 'CONFIRMED') return { success: false, error: 'Booking not found' }
  
  const session = sessions.find(s => s.id === booking.sessionId)
  if (!session) return { success: false, error: 'Session not found' }
  
  // Check cutoff
  const sessionDateTime = new Date(session.date)
  const [h, m] = session.startTime.split(':').map(Number)
  sessionDateTime.setHours(h, m)
  const hoursUntil = (sessionDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  
  if (hoursUntil < POLICY.cancelCutoffHours) {
    return { success: false, error: `Cannot cancel within ${POLICY.cancelCutoffHours} hours of session` }
  }
  
  // Restore entitlement
  const charge = bookingCharges.find(c => c.bookingId === bookingId)
  if (charge) {
    const entitlement = entitlements.find(e => e.id === charge.entitlementId)
    if (entitlement) entitlement.remaining += charge.unitsUsed
  }
  
  booking.status = 'CANCELLED'
  booking.cancelledAt = new Date()
  session.bookedCount -= 1
  
  return { success: true }
}

export function joinWaitlist(userId: string, sessionId: string): WaitlistEntry | { error: string } {
  const session = sessions.find(s => s.id === sessionId)
  if (!session) return { error: 'Session not found' }
  
  const existing = waitlistEntries.find(w => w.userId === userId && w.sessionId === sessionId && w.status === 'WAITING')
  if (existing) return { error: 'Already on waitlist' }
  
  const position = waitlistEntries.filter(w => w.sessionId === sessionId && w.status === 'WAITING').length + 1
  
  const entry: WaitlistEntry = {
    id: genId('waitlist'),
    userId,
    sessionId,
    status: 'WAITING',
    position,
    joinedAt: new Date(),
  }
  
  waitlistEntries.push(entry)
  session.waitlistCount += 1
  
  return entry
}

export function offerWaitlistSpot(sessionId: string): WaitlistEntry | null {
  const waiting = waitlistEntries
    .filter(w => w.sessionId === sessionId && w.status === 'WAITING')
    .sort((a, b) => a.position - b.position)
  
  if (waiting.length === 0) return null
  
  const entry = waiting[0]
  entry.status = 'OFFERED'
  entry.offeredAt = new Date()
  entry.offerExpiresAt = addDays(new Date(), 0) // actually add minutes
  entry.offerExpiresAt.setMinutes(entry.offerExpiresAt.getMinutes() + POLICY.waitlistOfferWindowMinutes)
  
  notificationEvents.push({
    id: genId('notif'),
    userId: entry.userId,
    type: 'WAITLIST_OFFER',
    title: 'Spot Available!',
    message: `A spot opened up! You have ${POLICY.waitlistOfferWindowMinutes} minutes to accept.`,
    read: false,
    createdAt: new Date(),
    data: { waitlistEntryId: entry.id, sessionId },
  })
  
  return entry
}

export function acceptWaitlistOffer(entryId: string, entitlementId: string): { booking: Booking } | { error: string } {
  const entry = waitlistEntries.find(w => w.id === entryId && w.status === 'OFFERED')
  if (!entry) return { error: 'No valid offer' }

  if (entry.offerExpiresAt && entry.offerExpiresAt < new Date()) {
    entry.status = 'EXPIRED'
    return { error: 'Offer expired' }
  }

  // Book directly without capacity check (spot was opened for waitlist)
  const session = sessions.find(s => s.id === entry.sessionId)
  if (!session) return { error: 'Session not found' }
  
  const entitlement = entitlements.find(e => e.id === entitlementId && e.userId === entry.userId)
  if (!entitlement || entitlement.remaining < 1) return { error: 'No valid entitlement' }

  const booking: Booking = {
    id: genId('booking'),
    userId: entry.userId,
    sessionId: entry.sessionId,
    status: 'CONFIRMED',
    bookedAt: new Date(),
    chargeId: '',
  }
  
  const charge: BookingCharge = {
    id: genId('charge'),
    bookingId: booking.id,
    entitlementId,
    unitsUsed: 1,
  }
  
  booking.chargeId = charge.id
  entitlement.remaining -= 1
  session.bookedCount += 1
  bookings.push(booking)
  bookingCharges.push(charge)

  entry.status = 'ACCEPTED'
  entry.acceptedAt = new Date()
  session.waitlistCount -= 1

  return { booking }
}

// ========== REHYDRATION ==========
// Restores persisted Zustand state back into the in-memory mock store after
// a page reload, so API calls return the correct data rather than empty arrays.
export function rehydrateMockStore(opts: {
  bookings?: Booking[]
  entitlements?: Entitlement[]
  waitlistEntries?: WaitlistEntry[]
}) {
  if (opts.bookings?.length) {
    // Merge: keep any new mock bookings, add back persisted ones that aren't already present
    const existingIds = new Set(bookings.map((b) => b.id))
    for (const b of opts.bookings) {
      if (!existingIds.has(b.id)) bookings.push(b)
    }
    // Sync bookedCount on sessions
    for (const b of bookings) {
      if (b.status === 'CONFIRMED') {
        const session = sessions.find((s) => s.id === b.sessionId)
        if (session) {
          const confirmedCount = bookings.filter(
            (x) => x.sessionId === b.sessionId && x.status === 'CONFIRMED'
          ).length
          session.bookedCount = Math.max(session.bookedCount, confirmedCount)
        }
      }
    }
  }

  if (opts.entitlements?.length) {
    const existingIds = new Set(entitlements.map((e) => e.id))
    for (const e of opts.entitlements) {
      if (!existingIds.has(e.id)) {
        entitlements.push(e)
      } else {
        // Update remaining credits to match persisted value
        const existing = entitlements.find((x) => x.id === e.id)
        if (existing) existing.remaining = e.remaining
      }
    }
  }

  if (opts.waitlistEntries?.length) {
    const existingIds = new Set(waitlistEntries.map((w) => w.id))
    for (const w of opts.waitlistEntries) {
      if (!existingIds.has(w.id)) waitlistEntries.push(w)
    }
  }
}

// ========== HELPERS ==========
export function getServiceType(id: string): ServiceType | undefined {
  for (const studio of studios) {
    const st = studio.serviceTypes.find(s => s.id === id)
    if (st) return st
  }
}

export function getRoom(studioId: string, roomId: string): Room | undefined {
  const studio = studios.find(s => s.id === studioId)
  return studio?.rooms.find(r => r.id === roomId)
}

export function getUserBookings(userId: string): Booking[] {
  return bookings.filter(b => b.userId === userId)
}

export function getUserEntitlements(userId: string): Entitlement[] {
  return entitlements.filter(e => e.userId === userId && e.remaining > 0)
}

export function addEntitlement(userId: string, productId: string): Entitlement {
  const product = products.find(p => p.id === productId)
  if (!product) throw new Error('Product not found')
  
  const ent: Entitlement = {
    id: genId('ent'),
    userId,
    type: product.type === 'CREDIT_PACK' ? 'CREDITS' : product.type === 'PACKAGE' ? 'PACKAGE' : 'CREDITS',
    productId,
    remaining: product.credits || product.sessionCount || 1,
    serviceTypeIds: product.serviceTypeIds || [],
    expiresAt: product.validDays ? addDays(new Date(), product.validDays) : undefined,
  }
  
  entitlements.push(ent)
  return ent
}
