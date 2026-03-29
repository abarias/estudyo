import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { sessionFromDb } from '@/lib/dbToModel'

// GET /api/instructor/sessions — sessions assigned to or claimable by the authenticated instructor
// ?date=  filter by date
// ?studioId=  filter by studio (shows all sessions for the studio, not just assigned ones)
export async function GET(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const dateParam = searchParams.get('date')
  const studioId = searchParams.get('studioId')

  const where: Record<string, unknown> = studioId
    ? { studioId }
    : { instructorId: userId }

  if (dateParam) {
    const d = new Date(dateParam)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    where.date = { gte: d, lt: next }
  } else {
    // Default: upcoming sessions only
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    where.date = { gte: now }
  }

  const sessions = await db.classSession.findMany({
    where,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 50,
  })

  // Enrich with studio and service type names, and instructor names
  const studioIds = Array.from(new Set(sessions.map(s => s.studioId)))
  const serviceTypeIds = Array.from(new Set(sessions.map(s => s.serviceTypeId)))
  const instructorIds = Array.from(new Set(sessions.map(s => s.instructorId).filter(Boolean)))

  const [studios, serviceTypes, instructors] = await Promise.all([
    db.studio.findMany({ where: { id: { in: studioIds } }, select: { id: true, name: true } }),
    db.serviceType.findMany({ where: { id: { in: serviceTypeIds } }, select: { id: true, name: true, color: true } }),
    instructorIds.length
      ? db.user.findMany({ where: { id: { in: instructorIds } }, select: { id: true, name: true } })
      : [],
  ])

  const studioMap = Object.fromEntries(studios.map(s => [s.id, s.name]))
  const serviceTypeMap = Object.fromEntries(serviceTypes.map(st => [st.id, { name: st.name, color: st.color }]))
  const instructorMap = Object.fromEntries(instructors.map(u => [u.id, u.name ?? '']))

  return Response.json(sessions.map(s => ({
    ...sessionFromDb(s),
    studioName: studioMap[s.studioId] ?? '',
    serviceTypeName: serviceTypeMap[s.serviceTypeId]?.name ?? '',
    serviceTypeColor: serviceTypeMap[s.serviceTypeId]?.color ?? 'muted',
    instructorId: s.instructorId,
    instructorName: s.instructorId ? (instructorMap[s.instructorId] ?? '') : '',
  })))
}
