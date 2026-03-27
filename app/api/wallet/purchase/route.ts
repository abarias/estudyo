import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { products } from '@/lib/mockStore'
import { addDays } from 'date-fns'

// POST /api/wallet/purchase — purchase a product and add entitlement
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await req.json()
  const product = products.find(p => p.id === productId)
  if (!product) return Response.json({ error: 'Product not found' }, { status: 404 })

  const entitlement = await db.entitlement.create({
    data: {
      userId,
      type: product.type === 'CREDIT_PACK' ? 'CREDITS' : 'CREDITS',
      productId,
      remaining: product.credits ?? product.sessionCount ?? 1,
      serviceTypeIds: JSON.stringify(product.serviceTypeIds ?? []),
      expiresAt: product.validDays ? addDays(new Date(), product.validDays) : null,
    },
  })

  return Response.json({
    success: true,
    entitlement: {
      ...entitlement,
      serviceTypeIds: JSON.parse(entitlement.serviceTypeIds ?? '[]'),
    },
  }, { status: 201 })
}
