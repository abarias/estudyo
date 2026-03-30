import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

async function verifyOwner(studioId: string, userId: string) {
  const studio = await db.studio.findUnique({ where: { id: studioId }, select: { ownerId: true } })
  return studio?.ownerId === userId
}

// POST /api/owner/studios/[id]/rooms — add a room to a studio
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyOwner(params.id, userId))) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { name, capacity } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })

  const room = await db.room.create({
    data: { studioId: params.id, name: name.trim(), capacity: parseInt(capacity) || 12 },
  })
  return Response.json(room, { status: 201 })
}
