import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { sessions } from '@/lib/mockStore'

// POST /api/waitlist/[id]/accept — accept a waitlist offer and create a booking
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { entitlementId } = await req.json()
  if (!entitlementId) return Response.json({ error: 'Missing entitlementId' }, { status: 400 })

  // Find the waitlist entry
  const entry = await db.waitlistEntry.findFirst({
    where: { id: params.id, userId, status: 'OFFERED' },
  })
  if (!entry) return Response.json({ error: 'No valid offer' }, { status: 404 })

  // Check offer expiry
  if (entry.offerExpiresAt && entry.offerExpiresAt < new Date()) {
    await db.waitlistEntry.update({
      where: { id: params.id },
      data: { status: 'EXPIRED' },
    })
    return Response.json({ error: 'Offer expired' }, { status: 409 })
  }

  // Validate session exists
  const mockSession = sessions.find(s => s.id === entry.sessionId)
  if (!mockSession) return Response.json({ error: 'Session not found' }, { status: 404 })

  // Validate entitlement
  const entitlement = await db.entitlement.findFirst({
    where: { id: entitlementId, userId, remaining: { gt: 0 } },
  })
  if (!entitlement) return Response.json({ error: 'No valid entitlement' }, { status: 400 })

  // Create booking + decrement entitlement + mark waitlist entry accepted
  const [booking] = await db.$transaction([
    db.booking.create({
      data: { userId, sessionId: entry.sessionId, status: 'CONFIRMED' },
    }),
    db.entitlement.update({
      where: { id: entitlementId },
      data: { remaining: { decrement: 1 } },
    }),
    db.waitlistEntry.update({
      where: { id: params.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    }),
  ])

  return Response.json(booking, { status: 201 })
}
