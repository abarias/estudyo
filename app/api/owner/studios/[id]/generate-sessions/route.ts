import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { calcEndTime, filterNonOverlapping } from '@/lib/sessionGeneration'

// POST /api/owner/studios/[id]/generate-sessions
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const studio = await db.studio.findUnique({
    where: { id: params.id },
    include: { rooms: true, serviceTypes: true },
  })
  if (!studio) return Response.json({ error: 'Studio not found' }, { status: 404 })
  if (studio.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { startDate, days } = await req.json()
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const templates = await db.sessionTemplate.findMany({
    where: { studioId: params.id, isActive: true },
  })

  const defaultRoom = studio.rooms[0]
  if (!defaultRoom || !templates.length) {
    return Response.json({ count: 0 })
  }

  const pending: Parameters<typeof filterNonOverlapping>[0] = []

  for (const template of templates) {
    const daysOfWeek: number[] = JSON.parse(template.daysOfWeek)
    const serviceType = studio.serviceTypes.find((st) => st.id === template.serviceTypeId)
    if (!serviceType) continue

    for (let d = 0; d < days; d++) {
      const date = new Date(start)
      date.setDate(date.getDate() + d)
      if (!daysOfWeek.includes(date.getDay())) continue

      pending.push({
        studioId: params.id,
        serviceTypeId: serviceType.id,
        roomId: template.roomId || defaultRoom.id,
        templateId: template.id,
        date,
        startTime: template.startTime,
        endTime: calcEndTime(template.startTime, serviceType.durationMinutes),
        capacity: template.capacityOverride ?? defaultRoom.capacity,
      })
    }
  }

  const { toCreate, skipped } = await filterNonOverlapping(pending)
  if (toCreate.length) await db.classSession.createMany({ data: toCreate })
  return Response.json({ count: toCreate.length, skipped })
}
