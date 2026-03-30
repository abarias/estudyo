import { db } from '@/lib/db'
import { addDays } from 'date-fns'
import { calcEndTime, filterNonOverlapping } from '@/lib/sessionGeneration'

// GET /api/admin/seed — idempotent seed of mock studio data into the DB
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  // Studios
  await Promise.all([
    db.studio.upsert({ where: { id: 'studio-1' }, create: { id: 'studio-1', name: 'Galaw BGC', description: 'Premium movement studio in the heart of Bonifacio Global City.', address: '4F High Street South Corporate Plaza, BGC, Taguig', coordLat: 14.5503, coordLng: 121.0494, timezone: 'Asia/Manila', ownerId: 'owner-1' }, update: {} }),
    db.studio.upsert({ where: { id: 'studio-2' }, create: { id: 'studio-2', name: 'Anino Wellness', description: 'Your sanctuary for mindful movement in Ortigas.', address: '3F Estancia Mall, Capitol Commons, Pasig', coordLat: 14.5872, coordLng: 121.0716, timezone: 'Asia/Manila', ownerId: 'owner-2' }, update: {} }),
  ])

  // Rooms, service types, products
  await Promise.all([
    db.room.upsert({ where: { id: 'room-1a' }, create: { id: 'room-1a', studioId: 'studio-1', name: 'Main Studio', capacity: 12 }, update: {} }),
    db.room.upsert({ where: { id: 'room-1b' }, create: { id: 'room-1b', studioId: 'studio-1', name: 'Reformer Room', capacity: 6 }, update: {} }),
    db.room.upsert({ where: { id: 'room-2a' }, create: { id: 'room-2a', studioId: 'studio-2', name: 'Yoga Hall', capacity: 15 }, update: {} }),
    db.room.upsert({ where: { id: 'room-2b' }, create: { id: 'room-2b', studioId: 'studio-2', name: 'Pilates Studio', capacity: 10 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-1' }, create: { id: 'st-1', studioId: 'studio-1', name: 'Mat Pilates', description: 'Core strength and flexibility', color: 'sage', durationMinutes: 55 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-2' }, create: { id: 'st-2', studioId: 'studio-1', name: 'Reformer Pilates', description: 'Machine-based resistance training', color: 'clay', durationMinutes: 50 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-3' }, create: { id: 'st-3', studioId: 'studio-1', name: 'Vinyasa Yoga', description: 'Dynamic flow yoga', color: 'blush', durationMinutes: 60 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-4' }, create: { id: 'st-4', studioId: 'studio-2', name: 'Yin Yoga', description: 'Deep stretch and relaxation', color: 'sky', durationMinutes: 75 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-5' }, create: { id: 'st-5', studioId: 'studio-2', name: 'Power Yoga', description: 'Strength-building yoga', color: 'sage', durationMinutes: 60 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-6' }, create: { id: 'st-6', studioId: 'studio-2', name: 'Barre', description: 'Ballet-inspired toning and endurance', color: 'clay', durationMinutes: 55 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-1' }, create: { id: 'prod-1', studioId: 'studio-1', type: 'SINGLE_SESSION', name: 'Drop-in Class', description: 'Single session pass', price: 750, validDays: 30 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-2' }, create: { id: 'prod-2', studioId: 'studio-1', type: 'CREDIT_PACK', name: '5 Class Pack', description: 'Save 15% on 5 classes', price: 3200, credits: 5, validDays: 60 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-3' }, create: { id: 'prod-3', studioId: 'studio-1', type: 'CREDIT_PACK', name: '10 Class Pack', description: 'Save 20% on 10 classes', price: 6000, credits: 10, validDays: 90 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-4' }, create: { id: 'prod-4', studioId: 'studio-2', type: 'SINGLE_SESSION', name: 'Drop-in Class', description: 'Single session pass', price: 650, validDays: 30 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-5' }, create: { id: 'prod-5', studioId: 'studio-2', type: 'CREDIT_PACK', name: '5 Class Pack', description: 'Best value for regulars', price: 2750, credits: 5, validDays: 60 }, update: {} }),
  ])

  // Templates: Mon/Wed/Fri at 07:00, 09:00, 12:00 for studio-1; Tue/Thu/Sat at 09:00, 17:00 for studio-2
  const templates = [
    { id: 'tpl-1a', studioId: 'studio-1', serviceTypeId: 'st-1', roomId: 'room-1a', daysOfWeek: [1, 3, 5], startTime: '07:00' },
    { id: 'tpl-1b', studioId: 'studio-1', serviceTypeId: 'st-2', roomId: 'room-1b', daysOfWeek: [1, 3, 5], startTime: '09:00' },
    { id: 'tpl-1c', studioId: 'studio-1', serviceTypeId: 'st-3', roomId: 'room-1a', daysOfWeek: [2, 4, 6], startTime: '12:00' },
    { id: 'tpl-2a', studioId: 'studio-2', serviceTypeId: 'st-4', roomId: 'room-2a', daysOfWeek: [2, 4, 6], startTime: '09:00' },
    { id: 'tpl-2b', studioId: 'studio-2', serviceTypeId: 'st-5', roomId: 'room-2a', daysOfWeek: [1, 3, 5], startTime: '17:00' },
    { id: 'tpl-2c', studioId: 'studio-2', serviceTypeId: 'st-6', roomId: 'room-2b', daysOfWeek: [2, 4, 6], startTime: '19:00' },
  ]

  await Promise.all(
    templates.map((t) =>
      db.sessionTemplate.upsert({
        where: { id: t.id },
        create: { id: t.id, studioId: t.studioId, serviceTypeId: t.serviceTypeId, roomId: t.roomId, daysOfWeek: JSON.stringify(t.daysOfWeek), startTime: t.startTime },
        update: {},
      })
    )
  )

  // Generate sessions for the next 14 days, skipping any that overlap existing ones
  const serviceTypes = await db.serviceType.findMany({ where: { studioId: { in: ['studio-1', 'studio-2'] } } })
  const rooms = await db.room.findMany({ where: { studioId: { in: ['studio-1', 'studio-2'] } } })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pending: Parameters<typeof filterNonOverlapping>[0] = []

  for (const tpl of templates) {
    const st = serviceTypes.find((s) => s.id === tpl.serviceTypeId)
    const room = rooms.find((r) => r.id === tpl.roomId)
    if (!st || !room) continue

    for (let d = 0; d < 14; d++) {
      const date = addDays(today, d)
      if (!tpl.daysOfWeek.includes(date.getDay())) continue
      pending.push({
        studioId: tpl.studioId,
        serviceTypeId: st.id,
        roomId: room.id,
        templateId: tpl.id,
        date,
        startTime: tpl.startTime,
        endTime: calcEndTime(tpl.startTime, st.durationMinutes),
        capacity: room.capacity,
      })
    }
  }

  const { toCreate, skipped } = await filterNonOverlapping(pending)
  if (toCreate.length) await db.classSession.createMany({ data: toCreate })

  const sessionCount = await db.classSession.count({ where: { studioId: { in: ['studio-1', 'studio-2'] } } })
  return Response.json({ ok: true, message: 'Seeded successfully', sessionCount, skipped })
}
