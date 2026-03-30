import { db } from '@/lib/db'
import { studioFromDb } from '@/lib/dbToModel'

export async function GET() {
  const studios = await db.studio.findMany({
    include: { rooms: true, serviceTypes: true },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(studios.map(studioFromDb))
}
