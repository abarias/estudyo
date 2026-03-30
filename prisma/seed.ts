import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter } as any)

async function main() {
  // ── Studio 1: Galaw BGC ──────────────────────────────────────────────────
  const studio1 = await db.studio.upsert({
    where: { id: 'studio-1' },
    create: {
      id: 'studio-1',
      name: 'Galaw BGC',
      description: 'Premium movement studio in the heart of Bonifacio Global City.',
      address: '4F High Street South Corporate Plaza, BGC, Taguig',
      coordLat: 14.5503,
      coordLng: 121.0494,
      timezone: 'Asia/Manila',
      ownerId: 'owner-1',
    },
    update: {},
  })

  await Promise.all([
    db.room.upsert({ where: { id: 'room-1a' }, create: { id: 'room-1a', studioId: 'studio-1', name: 'Main Studio', capacity: 12 }, update: {} }),
    db.room.upsert({ where: { id: 'room-1b' }, create: { id: 'room-1b', studioId: 'studio-1', name: 'Reformer Room', capacity: 6 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-1' }, create: { id: 'st-1', studioId: 'studio-1', name: 'Mat Pilates', description: 'Core strength and flexibility', color: 'sage', durationMinutes: 55 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-2' }, create: { id: 'st-2', studioId: 'studio-1', name: 'Reformer Pilates', description: 'Machine-based resistance training', color: 'clay', durationMinutes: 50 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-3' }, create: { id: 'st-3', studioId: 'studio-1', name: 'Vinyasa Yoga', description: 'Dynamic flow yoga', color: 'blush', durationMinutes: 60 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-1' }, create: { id: 'prod-1', studioId: 'studio-1', type: 'SINGLE_SESSION', name: 'Drop-in Class', description: 'Single session pass', price: 750, validDays: 30 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-2' }, create: { id: 'prod-2', studioId: 'studio-1', type: 'CREDIT_PACK', name: '5 Class Pack', description: 'Save 15% on 5 classes', price: 3200, credits: 5, validDays: 60 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-3' }, create: { id: 'prod-3', studioId: 'studio-1', type: 'CREDIT_PACK', name: '10 Class Pack', description: 'Save 20% on 10 classes', price: 6000, credits: 10, validDays: 90 }, update: {} }),
  ])

  // ── Studio 2: Anino Wellness ─────────────────────────────────────────────
  const studio2 = await db.studio.upsert({
    where: { id: 'studio-2' },
    create: {
      id: 'studio-2',
      name: 'Anino Wellness',
      description: 'Your sanctuary for mindful movement in Ortigas.',
      address: '3F Estancia Mall, Capitol Commons, Pasig',
      coordLat: 14.5872,
      coordLng: 121.0716,
      timezone: 'Asia/Manila',
      ownerId: 'owner-2',
    },
    update: {},
  })

  await Promise.all([
    db.room.upsert({ where: { id: 'room-2a' }, create: { id: 'room-2a', studioId: 'studio-2', name: 'Yoga Hall', capacity: 15 }, update: {} }),
    db.room.upsert({ where: { id: 'room-2b' }, create: { id: 'room-2b', studioId: 'studio-2', name: 'Pilates Studio', capacity: 10 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-4' }, create: { id: 'st-4', studioId: 'studio-2', name: 'Yin Yoga', description: 'Deep stretch and relaxation', color: 'sky', durationMinutes: 75 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-5' }, create: { id: 'st-5', studioId: 'studio-2', name: 'Power Yoga', description: 'Strength-building yoga', color: 'sage', durationMinutes: 60 }, update: {} }),
    db.serviceType.upsert({ where: { id: 'st-6' }, create: { id: 'st-6', studioId: 'studio-2', name: 'Barre', description: 'Ballet-inspired toning and endurance', color: 'clay', durationMinutes: 55 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-4' }, create: { id: 'prod-4', studioId: 'studio-2', type: 'SINGLE_SESSION', name: 'Drop-in Class', description: 'Single session pass', price: 650, validDays: 30 }, update: {} }),
    db.product.upsert({ where: { id: 'prod-5' }, create: { id: 'prod-5', studioId: 'studio-2', type: 'CREDIT_PACK', name: '5 Class Pack', description: 'Best value for regulars', price: 2750, credits: 5, validDays: 60 }, update: {} }),
  ])

  console.log('Seed complete')
}

main().catch(console.error).finally(() => db.$disconnect())
