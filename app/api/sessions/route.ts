import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sessionFromDb } from '@/lib/dbToModel'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const studioId = searchParams.get('studioId') ?? undefined
  const dateParam = searchParams.get('date')
  const serviceTypeId = searchParams.get('serviceTypeId') ?? undefined

  const where: Record<string, unknown> = {}
  if (studioId) where.studioId = studioId
  if (serviceTypeId) where.serviceTypeId = serviceTypeId
  if (dateParam) {
    const d = new Date(dateParam)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    where.date = { gte: d, lt: next }
  }

  const sessions = await db.classSession.findMany({
    where,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  // Batch-fetch instructor names
  const instructorIds = Array.from(new Set(sessions.map(s => s.instructorId).filter(Boolean)))
  const instructors = instructorIds.length
    ? await db.user.findMany({ where: { id: { in: instructorIds } }, select: { id: true, name: true } })
    : []
  const instructorMap = Object.fromEntries(instructors.map(u => [u.id, u.name ?? '']))

  return Response.json(sessions.map(s => ({
    ...sessionFromDb(s),
    instructorName: s.instructorId ? (instructorMap[s.instructorId] ?? '') : '',
  })))
}
