import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

const VALID_ROLES = ['CUSTOMER', 'OWNER', 'INSTRUCTOR'] as const

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { role } = await req.json()
  if (!VALID_ROLES.includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { role, onboarded: true },
    select: { id: true, role: true, onboarded: true },
  })

  return Response.json(user)
}
