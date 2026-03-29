import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// PATCH /api/owner/studios/[id] — update studio settings
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const studio = await db.studio.findUnique({ where: { id: params.id } })
  if (!studio) return Response.json({ error: 'Studio not found' }, { status: 404 })
  if (studio.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { waitlistEnabled } = body

  try {
    const updated = await db.studio.update({
      where: { id: params.id },
      data: { waitlistEnabled },
    })
    return Response.json({ id: updated.id, waitlistEnabled: updated.waitlistEnabled })
  } catch (e) {
    console.error('[PATCH /api/owner/studios/:id]', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
