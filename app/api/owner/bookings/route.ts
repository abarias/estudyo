import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// GET /api/owner/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns sessions (with booking counts) for all studios owned by the current user.
export async function GET(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  // Default range: past 7 days → next 14 days
  const from = fromParam ? new Date(fromParam) : (() => { const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0,0,0,0); return d })()
  const to = toParam ? new Date(toParam) : (() => { const d = new Date(); d.setDate(d.getDate() + 14); d.setHours(23,59,59,999); return d })()

  // Fetch studios owned by this user
  const studios = await db.studio.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true, serviceTypes: { select: { id: true, name: true, color: true } } },
  })

  if (studios.length === 0) {
    return Response.json({ stats: { confirmed: 0, cancelled: 0 }, sessions: [] })
  }

  const studioIds = studios.map((s) => s.id)
  const studioMap = Object.fromEntries(studios.map((s) => [s.id, s]))

  // Fetch sessions in date range for owned studios
  const sessions = await db.classSession.findMany({
    where: { studioId: { in: studioIds }, date: { gte: from, lte: to } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  if (sessions.length === 0) {
    return Response.json({ stats: { confirmed: 0, cancelled: 0 }, sessions: [] })
  }

  const sessionIds = sessions.map((s) => s.id)

  // Fetch all bookings for these sessions
  const bookings = await db.booking.findMany({
    where: { sessionId: { in: sessionIds } },
    select: { id: true, sessionId: true, userId: true, status: true, bookedAt: true },
  })

  // Aggregate stats
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length

  // Build per-session booking counts — only include sessions with at least one booking
  const bookingsBySession: Record<string, typeof bookings> = {}
  for (const b of bookings) {
    if (!bookingsBySession[b.sessionId]) bookingsBySession[b.sessionId] = []
    bookingsBySession[b.sessionId].push(b)
  }

  const sessionResults = sessions
    .map((session) => {
      const sessionBookings = bookingsBySession[session.id] ?? []
      const studio = studioMap[session.studioId]
      const serviceType = studio?.serviceTypes.find((st) => st.id === session.serviceTypeId)
      return {
        id: session.id,
        studioId: session.studioId,
        studioName: studio?.name ?? '',
        serviceTypeId: session.serviceTypeId,
        serviceTypeName: serviceType?.name ?? 'Class',
        serviceTypeColor: serviceType?.color ?? 'sage',
        date: session.date.toISOString(),
        startTime: session.startTime,
        endTime: session.endTime,
        capacity: session.capacity,
        confirmedCount: sessionBookings.filter((b) => b.status === 'CONFIRMED').length,
        cancelledCount: sessionBookings.filter((b) => b.status === 'CANCELLED').length,
      }
    })
    .filter((s) => s.confirmedCount > 0 || s.cancelledCount > 0)

  return Response.json({ stats: { confirmed, cancelled }, sessions: sessionResults })
}
