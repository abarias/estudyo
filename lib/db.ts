/**
 * Prisma client singleton.
 *
 * Currently unused at runtime (NextAuth uses JWT sessions).
 * Ready for activation once a libsql/PostgreSQL URL is configured.
 *
 * To activate:
 *   1. Set DATABASE_URL in .env.local
 *   2. npm install @prisma/adapter-libsql @libsql/client
 *   3. Uncomment the adapter setup below and import db in lib/auth.ts
 */

// import { PrismaClient } from '@/lib/generated/prisma'
// import { LibsqlAdapter } from '@prisma/adapter-libsql'
// import { createClient } from '@libsql/client'
//
// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
//
// function createPrismaClient() {
//   const libsql = createClient({ url: process.env.DATABASE_URL! })
//   const adapter = new LibsqlAdapter(libsql)
//   return new PrismaClient({ adapter } as any)
// }
//
// export const db = globalForPrisma.prisma ?? createPrismaClient()
// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export {}
