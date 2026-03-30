import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// DELETE /api/owner/studios/[id]/instructors/[instructorId] — remove instructor from studio
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; instructorId: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const studio = await db.studio.findUnique({ where: { id: params.id } })
  if (!studio || studio.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await db.studioInstructor.deleteMany({
    where: { studioId: params.id, instructorId: params.instructorId },
  })

  return Response.json({ ok: true })
}
