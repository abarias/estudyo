import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { productFromDb } from '@/lib/dbToModel'

export async function GET(req: NextRequest) {
  const studioId = req.nextUrl.searchParams.get('studioId') ?? undefined
  const products = await db.product.findMany({
    where: { ...(studioId ? { studioId } : {}), isActive: true },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(products.map(productFromDb))
}
