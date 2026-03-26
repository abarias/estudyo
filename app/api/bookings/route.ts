import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { sessions } from '@/lib/mockStore'
import { addDays } from 'date-fns'
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
  if (!sessionId || !entitlementId) {
    return Response.json({ error: 'Missing sessionId or entitlementId' }, { status: 400 })
  }

  // Validate session exists in mock catalog
  const mockSession = sessions.find(s => s.id === sessionId)
  if (!mockSession) return Response.json({ error: 'Session not found' }, { status: 404 })

  // Validate entitlement belongs to user and has remaining credits
  const entitlement = await db.entitlement.findFirst({
    where: { id: entitlementId, userId, remaining: { gt: 0 } },
  })
  console.log('[POST /api/bookings] userId:', userId, 'entitlementId:', entitlementId, 'found:', !!entitlement)
  if (!entitlement) return Response.json({ error: 'No valid entitlement' }, { status: 400 })

  // Check capacity: count existing confirmed bookings for this session
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

  // Create booking + decrement entitlement in a transaction
  let booking
  try {
    const result = await db.$transaction([
      db.booking.create({
        data: { userId, sessionId, status: 'CONFIRMED' },
      }),
      db.entitlement.update({
        where: { id: entitlementId },
        data: { remaining: { decrement: 1 } },
      }),
    ])
    booking = result[0]
  } catch (err) {
    console.error('[POST /api/bookings] transaction error:', err)
    return Response.json({ error: 'Transaction failed', detail: String(err) }, { status: 500 })
  }

  return Response.json(booking, { status: 201 })
}
