import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { lookupSession } from '@/lib/lookupSession'
import { POLICY } from '@/lib/mockStore'

// GET /api/bookings — list all bookings for the authenticated user
export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const bookings = await db.booking.findMany({
    where: { userId },
    orderBy: { bookedAt: 'desc' },
  })

  return Response.json(bookings)
}

// POST /api/bookings — create a booking
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, entitlementId } = await req.json()
  if (!sessionId) {
    return Response.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const mockSession = await lookupSession(sessionId)
  if (!mockSession) return Response.json({ error: 'Session not found' }, { status: 404 })

  // Validate entitlement if provided (payment flow — currently optional)
  let entitlement = null
  if (entitlementId) {
    entitlement = await db.entitlement.findFirst({
      where: { id: entitlementId, userId, remaining: { gt: 0 } },
    })
    if (!entitlement) return Response.json({ error: 'No valid entitlement' }, { status: 400 })
  }

  // Check capacity
  const existingCount = await db.booking.count({
    where: { sessionId, status: 'CONFIRMED' },
  })
  if (existingCount >= mockSession.capacity) {
    return Response.json({ error: 'Session full' }, { status: 409 })
  }

  // Check booking cutoff
  const sessionDateTime = new Date(mockSession.date)
  const [h, m] = mockSession.startTime.split(':').map(Number)
  sessionDateTime.setHours(h, m)
  const minutesUntil = (sessionDateTime.getTime() - Date.now()) / (1000 * 60)
  if (minutesUntil < POLICY.bookingCutoffMinutes) {
    return Response.json({ error: 'Booking window has closed' }, { status: 409 })
  }

  // Create booking; decrement entitlement only if one was provided
  let booking
  if (entitlement) {
    const [created] = await db.$transaction([
      db.booking.create({ data: { userId, sessionId, status: 'CONFIRMED' } }),
      db.entitlement.update({ where: { id: entitlementId }, data: { remaining: { decrement: 1 } } }),
    ])
    booking = created
  } else {
    booking = await db.booking.create({ data: { userId, sessionId, status: 'CONFIRMED' } })
  }

  return Response.json(booking, { status: 201 })
}
