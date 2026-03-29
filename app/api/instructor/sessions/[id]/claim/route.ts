import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// PATCH /api/instructor/sessions/[id]/claim — instructor self-assigns to a session
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await db.classSession.findUnique({ where: { id: params.id } })
  if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })

  // Verify instructor is tagged to this studio
  const tagged = await db.studioInstructor.findUnique({
    where: { studioId_instructorId: { studioId: session.studioId, instructorId: userId } },
  })
  if (!tagged) return Response.json({ error: 'Not tagged to this studio' }, { status: 403 })

  const { unclaim } = await req.json().catch(() => ({ unclaim: false }))

  if (unclaim) {
    // Only allow unclaiming if they're the assigned instructor
    if (session.instructorId !== userId) {
      return Response.json({ error: 'You are not assigned to this session' }, { status: 403 })
    }
    const updated = await db.classSession.update({
      where: { id: params.id },
      data: { instructorId: '' },
    })
    return Response.json({ id: updated.id, instructorId: '' })
  }

  // Only claim if unassigned
  if (session.instructorId && session.instructorId !== '') {
    return Response.json({ error: 'Session already has an instructor' }, { status: 409 })
  }

  const instructor = await db.user.findUnique({ where: { id: userId }, select: { name: true } })

  const updated = await db.classSession.update({
    where: { id: params.id },
    data: { instructorId: userId },
  })

  return Response.json({ id: updated.id, instructorId: userId, instructorName: instructor?.name ?? '' })
}
