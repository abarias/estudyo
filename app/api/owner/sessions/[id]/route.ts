import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// PATCH /api/owner/sessions/[id] — assign instructor to a session
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await db.classSession.findUnique({ where: { id: params.id }, select: { studioId: true } })
  if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })

  // Verify the session belongs to a studio owned by this user
  const studio = await db.studio.findUnique({ where: { id: session.studioId }, select: { ownerId: true } })
  if (!studio || studio.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { instructorId } = await req.json()

  const updated = await db.classSession.update({
    where: { id: params.id },
    data: { instructorId: instructorId ?? '' },
  })

  let instructorName = ''
  if (updated.instructorId) {
    const instructor = await db.user.findUnique({ where: { id: updated.instructorId }, select: { name: true } })
    instructorName = instructor?.name ?? ''
  }

  return Response.json({ id: updated.id, instructorId: updated.instructorId, instructorName })
}
