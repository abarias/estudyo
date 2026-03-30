import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { studioFromDb } from '@/lib/dbToModel'
import { calcEndTime, filterNonOverlapping } from '@/lib/sessionGeneration'

// GET /api/owner/studios — list studios owned by the current user with template counts
export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const studios = await db.studio.findMany({
    where: { ownerId: userId },
    include: {
      rooms: true,
      serviceTypes: true,
      _count: { select: { classSessions: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const templateCounts = await Promise.all(
    studios.map((s) => db.sessionTemplate.count({ where: { studioId: s.id, isActive: true } }))
  )

  return Response.json(
    studios.map((s, i) => ({
      ...studioFromDb(s),
      templateCount: templateCounts[i],
    }))
  )
}

// POST /api/owner/studios — create a studio with all nested data and generate initial sessions
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== 'OWNER') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, description, address, coordLat, coordLng, timezone, waitlistEnabled, rooms, serviceTypes, products, templates, instructorIds, generateDays } = body

  const { studioRecord, createdRooms, createdServiceTypes, createdTemplates } = await db.$transaction(async (tx) => {
    const s = await tx.studio.create({
      data: {
        name,
        description: description ?? '',
        address: address ?? '',
        coordLat: coordLat ?? null,
        coordLng: coordLng ?? null,
        timezone: timezone ?? 'UTC',
        waitlistEnabled: waitlistEnabled ?? true,
        ownerId: userId,
      },
    })

    // Tag instructors to the studio
    if (Array.isArray(instructorIds) && instructorIds.length > 0) {
      await Promise.all(
        instructorIds.map((instructorId: string) =>
          tx.studioInstructor.upsert({
            where: { studioId_instructorId: { studioId: s.id, instructorId } },
            create: { studioId: s.id, instructorId },
            update: {},
          })
        )
      )
    }

    const createdRooms = await Promise.all(
      (rooms ?? []).map((r: { name: string; capacity: number }) =>
        tx.room.create({ data: { studioId: s.id, name: r.name, capacity: r.capacity } })
      )
    )

    const createdServiceTypes = await Promise.all(
      (serviceTypes ?? []).map((st: { name: string; durationMinutes: number; color: string }) =>
        tx.serviceType.create({ data: { studioId: s.id, name: st.name, description: '', color: st.color ?? 'sage', durationMinutes: st.durationMinutes } })
      )
    )

    await Promise.all(
      (products ?? []).map((p: { type: string; name: string; price: number; credits?: number; sessions?: number; expiryDays?: number }) =>
        tx.product.create({
          data: {
            studioId: s.id,
            type: p.type,
            name: p.name,
            price: p.price,
            credits: p.credits ?? null,
            sessionCount: p.sessions ?? null,
            validDays: p.expiryDays ?? 30,
          },
        })
      )
    )

    // Map temp serviceTypeId → real DB id
    const stIdMap: Record<string, string> = {}
    ;(serviceTypes ?? []).forEach((st: { id: string }, idx: number) => {
      stIdMap[st.id] = createdServiceTypes[idx]?.id ?? ''
    })

    const createdTemplates = await Promise.all(
      (templates ?? []).map((t: { serviceTypeId: string; daysOfWeek: number[]; startTime: string; capacityOverride?: number }) =>
        tx.sessionTemplate.create({
          data: {
            studioId: s.id,
            serviceTypeId: stIdMap[t.serviceTypeId] ?? t.serviceTypeId,
            roomId: createdRooms[0]?.id ?? '',
            daysOfWeek: JSON.stringify(t.daysOfWeek),
            startTime: t.startTime,
            capacityOverride: t.capacityOverride ?? null,
          },
        })
      )
    )

    return { studioRecord: s, createdRooms, createdServiceTypes, createdTemplates }
  })

  // Generate sessions outside the transaction to avoid P2028 timeout
  const days = generateDays ?? 14
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const defaultRoom = createdRooms[0]

  const pending: Parameters<typeof filterNonOverlapping>[0] = []

  for (const template of createdTemplates) {
    const daysOfWeek: number[] = JSON.parse(template.daysOfWeek)
    const serviceType = createdServiceTypes.find((st) => st.id === template.serviceTypeId)
    if (!serviceType || !defaultRoom) continue

    for (let d = 0; d < days; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() + d)
      if (!daysOfWeek.includes(date.getDay())) continue

      pending.push({
        studioId: studioRecord.id,
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

  const { toCreate } = await filterNonOverlapping(pending)
  if (toCreate.length) await db.classSession.createMany({ data: toCreate })

  const studio = await db.studio.findUnique({
    where: { id: studioRecord.id },
    include: { rooms: true, serviceTypes: true },
  })

  return Response.json({ studio: studioFromDb(studio!) }, { status: 201 })
}
