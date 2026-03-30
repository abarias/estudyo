import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { studioFromDb } from '@/lib/dbToModel'

// GET /api/instructor/studios — studios the authenticated instructor is tagged to
export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.studioInstructor.findMany({
    where: { instructorId: userId },
    include: { studio: true },
  })

  return Response.json(rows.map(r => studioFromDb(r.studio)))
}
