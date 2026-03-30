import { db } from '@/lib/db'
import { studioFromDb } from '@/lib/dbToModel'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const studio = await db.studio.findUnique({
    where: { id: params.id },
    include: { rooms: true, serviceTypes: true },
  })
  if (!studio) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(studioFromDb(studio))
}
