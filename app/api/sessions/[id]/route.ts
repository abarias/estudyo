import { db } from '@/lib/db'
import { sessionFromDb } from '@/lib/dbToModel'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await db.classSession.findUnique({ where: { id: params.id } })
  if (!session) return Response.json({ error: 'Not found' }, { status: 404 })

  let instructorName = ''
  if (session.instructorId) {
    const user = await db.user.findUnique({ where: { id: session.instructorId }, select: { name: true } })
    instructorName = user?.name ?? ''
  }

  return Response.json({ ...sessionFromDb(session), instructorName })
}
