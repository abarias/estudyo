import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// DELETE /api/owner/studios/[id]/services/[serviceId] — remove a service type
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; serviceId: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const studio = await db.studio.findUnique({ where: { id: params.id }, select: { ownerId: true } })
  if (studio?.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await db.serviceType.delete({ where: { id: params.serviceId } })
  return new Response(null, { status: 204 })
}
