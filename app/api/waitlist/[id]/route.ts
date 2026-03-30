import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// DELETE /api/waitlist/[id] — cancel a waitlist entry
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const entry = await db.waitlistEntry.findFirst({
    where: { id: params.id, userId, status: 'WAITING' },
  })
  if (!entry) return Response.json({ error: 'Entry not found' }, { status: 404 })

  await db.waitlistEntry.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  })

  await db.classSession.updateMany({
    where: { id: entry.sessionId },
    data: { waitlistCount: { decrement: 1 } },
  })

  return Response.json({ ok: true })
}
