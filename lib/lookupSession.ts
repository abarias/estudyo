import { db } from '@/lib/db'
import { sessions as mockSessions } from '@/lib/mockStore'

// Looks up a session by ID — DB first, then mockStore fallback for legacy IDs
export async function lookupSession(sessionId: string) {
  const dbSession = await db.classSession.findUnique({ where: { id: sessionId } })
  if (dbSession) return dbSession

  // Fallback for in-memory session-N IDs
  const mock = mockSessions.find((s) => s.id === sessionId)
  if (!mock) return null
  return {
    id: mock.id,
    studioId: mock.studioId,
    serviceTypeId: mock.serviceTypeId,
    roomId: mock.roomId,
    date: mock.date,
    startTime: mock.startTime,
    endTime: mock.endTime,
    capacity: mock.capacity,
    bookedCount: mock.bookedCount,
    waitlistCount: mock.waitlistCount,
    status: mock.status,
  }
}
