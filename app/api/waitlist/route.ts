import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { lookupSession } from '@/lib/lookupSession'

// GET /api/waitlist — get waitlist entries for authenticated user
export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const entries = await db.waitlistEntry.findMany({
    where: { userId },
    orderBy: { joinedAt: 'desc' },
  })

  return Response.json(entries)
}

// POST /api/waitlist — join waitlist for a session
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await req.json()
  if (!sessionId) return Response.json({ error: 'Missing sessionId' }, { status: 400 })

  const mockSession = await lookupSession(sessionId)
  if (!mockSession) return Response.json({ error: 'Session not found' }, { status: 404 })

  // Check studio waitlist setting
  const studio = await db.studio.findUnique({ where: { id: mockSession.studioId }, select: { waitlistEnabled: true } })
  if (studio && !studio.waitlistEnabled) {
    return Response.json({ error: 'Waitlist is not enabled for this studio' }, { status: 403 })
  }

  // Check not already on waitlist
  const existing = await db.waitlistEntry.findFirst({
    where: { userId, sessionId, status: 'WAITING' },
  })
  if (existing) return Response.json({ error: 'Already on waitlist' }, { status: 409 })

  // Determine position
  const position = await db.waitlistEntry.count({
    where: { sessionId, status: 'WAITING' },
  }) + 1

  const entry = await db.waitlistEntry.create({
    data: { userId, sessionId, status: 'WAITING', position },
  })

  // Persist waitlistCount on DB sessions
  await db.classSession.updateMany({
    where: { id: sessionId },
    data: { waitlistCount: { increment: 1 } },
  })

  return Response.json(entry, { status: 201 })
}
