import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// POST /api/owner/studios/[id]/services — add a service type to a studio
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const studio = await db.studio.findUnique({ where: { id: params.id }, select: { ownerId: true } })
  if (studio?.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { name, durationMinutes, color } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })

  const service = await db.serviceType.create({
    data: {
      studioId: params.id,
      name: name.trim(),
      description: '',
      durationMinutes: parseInt(durationMinutes) || 60,
      color: color ?? 'sage',
    },
  })
  return Response.json(service, { status: 201 })
}
