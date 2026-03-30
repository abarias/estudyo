import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { studioFromDb } from '@/lib/dbToModel'

// GET /api/owner/studios/[id] — fetch a single studio with rooms and serviceTypes
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const studio = await db.studio.findUnique({
    where: { id: params.id },
    include: { rooms: true, serviceTypes: true },
  })
  if (!studio) return Response.json({ error: 'Not found' }, { status: 404 })
  if (studio.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  return Response.json(studioFromDb(studio))
}

// PATCH /api/owner/studios/[id] — update studio settings
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const studio = await db.studio.findUnique({ where: { id: params.id } })
  if (!studio) return Response.json({ error: 'Studio not found' }, { status: 404 })
  if (studio.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, description, address, coordLat, coordLng, timezone, waitlistEnabled } = body

  // Build update data from only provided fields
  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description
  if (address !== undefined) data.address = address
  if (coordLat !== undefined) data.coordLat = coordLat
  if (coordLng !== undefined) data.coordLng = coordLng
  if (timezone !== undefined) data.timezone = timezone
  if (waitlistEnabled !== undefined) data.waitlistEnabled = waitlistEnabled

  try {
    const updated = await db.studio.update({ where: { id: params.id }, data })
    return Response.json({
      id: updated.id,
      name: updated.name,
      address: updated.address,
      coordLat: updated.coordLat,
      coordLng: updated.coordLng,
      timezone: updated.timezone,
      waitlistEnabled: updated.waitlistEnabled,
    })
  } catch (e) {
    console.error('[PATCH /api/owner/studios/:id]', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
