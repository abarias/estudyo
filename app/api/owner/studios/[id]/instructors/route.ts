import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

async function verifyOwner(studioId: string, userId: string) {
  const studio = await db.studio.findUnique({ where: { id: studioId } })
  return studio?.ownerId === userId ? studio : null
}

// GET /api/owner/studios/[id]/instructors — list instructors tagged to studio
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await verifyOwner(params.id, userId)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const rows = await db.studioInstructor.findMany({ where: { studioId: params.id } })
  const instructorIds = rows.map(r => r.instructorId)
  const users = instructorIds.length
    ? await db.user.findMany({ where: { id: { in: instructorIds } }, select: { id: true, name: true, email: true } })
    : []

  return Response.json(users)
}

// POST /api/owner/studios/[id]/instructors — tag instructor to studio
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await verifyOwner(params.id, userId)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { instructorId } = await req.json()
  if (!instructorId) return Response.json({ error: 'instructorId required' }, { status: 400 })

  // Verify the user is actually an instructor
  const instructor = await db.user.findUnique({ where: { id: instructorId }, select: { id: true, name: true, email: true, role: true } })
  if (!instructor || instructor.role !== 'INSTRUCTOR') {
    return Response.json({ error: 'User is not an instructor' }, { status: 400 })
  }

  await db.studioInstructor.upsert({
    where: { studioId_instructorId: { studioId: params.id, instructorId } },
    create: { studioId: params.id, instructorId },
    update: {},
  })

  return Response.json({ id: instructor.id, name: instructor.name, email: instructor.email })
}
