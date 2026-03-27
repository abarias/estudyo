import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { addDays } from 'date-fns'

const STARTER_CREDITS = 3
const STARTER_PRODUCT_ID = 'prod-2'

// GET /api/wallet — get entitlements + total credits for authenticated user
export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let entitlements = await db.entitlement.findMany({
    where: { userId, remaining: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  })

  // Seed starter credits for brand-new users
  if (entitlements.length === 0) {
    const newEnt = await db.entitlement.create({
      data: {
        userId,
        type: 'CREDITS',
        productId: STARTER_PRODUCT_ID,
        remaining: STARTER_CREDITS,
        serviceTypeIds: '[]',
        expiresAt: addDays(new Date(), 45),
      },
    })
    entitlements = [newEnt]
  }

  const totalCredits = entitlements.reduce((sum, e) => sum + e.remaining, 0)

  // Deserialize serviceTypeIds from JSON string
  const mapped = entitlements.map(e => ({
    ...e,
    serviceTypeIds: JSON.parse(e.serviceTypeIds ?? '[]') as string[],
  }))

  return Response.json({ entitlements: mapped, totalCredits })
}
