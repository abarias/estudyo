import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {})
  return new PrismaClient({ adapter } as any)
}

export const db: PrismaClient = globalThis._prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis._prisma = db
