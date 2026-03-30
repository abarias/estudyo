import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

// GET /api/owner/instructors — list all users with INSTRUCTOR role
export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const instructors = await db.user.findMany({
    where: { role: 'INSTRUCTOR' },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: 'asc' },
  })

  return Response.json(instructors)
}
