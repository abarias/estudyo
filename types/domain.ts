// ========== USER & PROFILES ==========
export type UserRole = 'CUSTOMER' | 'INSTRUCTOR' | 'OWNER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  roles: UserRole[]
  createdAt: Date
}

export interface CustomerProfile {
  userId: string
  phone?: string
  emergencyContact?: string
  preferences: NotificationPreference
}

export interface InstructorProfile {
  userId: string
  bio?: string
  specialties: string[]
  studioIds: string[]
}

// ========== STUDIO & ROOMS ==========
export interface Studio {
  id: string
  name: string
  description: string
  address: string
  imageUrl?: string
  ownerId: string
  serviceTypes: ServiceType[]
  rooms: Room[]
  createdAt: Date
}

export interface Room {
  id: string
  studioId: string
  name: string
  capacity: number
}

export interface ServiceType {
  id: string
  studioId: string
  name: string
  description: string
  color: 'sage' | 'clay' | 'blush' | 'sky'
  durationMinutes: number
}

// ========== SESSIONS ==========
export interface SessionTemplate {
  id: string
  studioId: string
  serviceTypeId: string
  roomId: string
  instructorId: string
  dayOfWeek: number // 0-6
  startTime: string // HH:mm
  defaultCapacity: number
}

export interface Session {
  id: string
  studioId: string
  serviceTypeId: string
  roomId: string
  instructorId: string
  templateId?: string
  date: Date
  startTime: string // HH:mm
  endTime: string   // HH:mm
  capacity: number
  bookedCount: number
  waitlistCount: number
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'
}

// ========== PRODUCTS & PRICING ==========
export type ProductType = 'SINGLE_SESSION' | 'CREDIT_PACK' | 'PACKAGE' | 'MEMBERSHIP'

export interface Product {
  id: string
  studioId: string
  type: ProductType
  name: string
  description: string
  price: number
  credits?: number           // for CREDIT_PACK
  sessionCount?: number      // for PACKAGE
  validDays?: number         // validity period
  serviceTypeIds?: string[]  // which services can be used with
}

export interface Purchase {
  id: string
  userId: string
  productId: string
  amount: number
  purchasedAt: Date
  paymentId: string
}

export interface Payment {
  id: string
  userId: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  method: 'CARD' | 'CASH' | 'TRANSFER'
  createdAt: Date
}

// ========== ENTITLEMENTS ==========
export type EntitlementType = 'CREDITS' | 'PACKAGE' | 'MEMBERSHIP'

export interface Entitlement {
  id: string
  userId: string
  type: EntitlementType
  productId: string
  remaining: number      // credits or sessions remaining
  expiresAt?: Date
  serviceTypeIds: string[] // empty = all services
}

// ========== BOOKINGS ==========
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export interface Booking {
  id: string
  userId: string
  sessionId: string
  status: BookingStatus
  bookedAt: Date
  cancelledAt?: Date
  chargeId: string
}

export interface BookingCharge {
  id: string
  bookingId: string
  entitlementId: string
  unitsUsed: number
}

// ========== WAITLIST ==========
export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'

export interface WaitlistEntry {
  id: string
  userId: string
  sessionId: string
  status: WaitlistStatus
  position: number
  joinedAt: Date
  offeredAt?: Date
  offerExpiresAt?: Date
  acceptedAt?: Date
}

// ========== NOTIFICATIONS ==========
export interface NotificationPreference {
  email: boolean
  push: boolean
  sms: boolean
}

export type NotificationEventType = 
  | 'BOOKING_CONFIRMED' 
  | 'BOOKING_CANCELLED' 
  | 'WAITLIST_OFFER' 
  | 'WAITLIST_EXPIRED'
  | 'SESSION_REMINDER'
  | 'CREDITS_LOW'

export interface NotificationEvent {
  id: string
  userId: string
  type: NotificationEventType
  title: string
  message: string
  read: boolean
  createdAt: Date
  data?: Record<string, unknown>
}
