import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { sessions } from '@/lib/mockStore'
import { POLICY } from '@/lib/mockStore'

// PATCH /api/bookings/[id] — cancel a booking
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await db.booking.findFirst({
    where: { id: params.id, userId, status: 'CONFIRMED' },
  })
  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })

  // Enforce cancellation cutoff
  const mockSession = sessions.find(s => s.id === booking.sessionId)
  if (mockSession) {
    const sessionDateTime = new Date(mockSession.date)
    const [h, m] = mockSession.startTime.split(':').map(Number)
    sessionDateTime.setHours(h, m)
    const hoursUntil = (sessionDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < POLICY.cancelCutoffHours) {
      return Response.json(
        { error: `Cannot cancel within ${POLICY.cancelCutoffHours} hours of session` },
        { status: 409 }
      )
    }
  }

  // Cancel booking + refund 1 credit to the entitlement used
  // Find the most recent entitlement for this user to refund to
  const entitlement = await db.entitlement.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  await db.$transaction([
    db.booking.update({
      where: { id: params.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    }),
    ...(entitlement
      ? [db.entitlement.update({
          where: { id: entitlement.id },
          data: { remaining: { increment: 1 } },
        })]
      : []),
  ])

  return Response.json({ success: true })
}
