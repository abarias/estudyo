/**
 * seed.mjs — Re-seed the database with realistic sample data.
 * Retains all User/Account/Session/VerificationToken rows.
 * Run: node scripts/seed.mjs
 */

import { neon } from '@neondatabase/serverless'
import { createRequire } from 'module'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
require('dotenv').config({ path: join(__dirname, '../.env.local') })

const sql = neon(process.env.DATABASE_URL)

// ── Real user IDs (from DB) ────────────────────────────────────────────────
const OWNER_ID      = 'cmn97o9wa0002pkbw4zakliiq'  // Caleb Magpoc
const INSTRUCTOR_ID = 'cmnalbidj0004gjbwiw6g8arj'  // Anthony Arias
const CUSTOMER_ID   = 'cmn7mq83j0004e6bwkbt9skn8'  // A.B. Arias

// ── Helpers ────────────────────────────────────────────────────────────────
let counter = 0
function uid(prefix = 'id') {
  return `${prefix}-${(++counter).toString().padStart(4, '0')}-${Date.now()}`
}

function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Generate dates (as ISO strings, midnight Manila time expressed in UTC)
 *  for dayOfWeek (0=Sun, 1=Mon, …, 6=Sat) over the next `days` days from `from`. */
function datesForDOW(daysOfWeek, from, days = 14) {
  const results = []
  for (let i = 0; i < days; i++) {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    if (daysOfWeek.includes(d.getDay())) {
      // Store as YYYY-MM-DD midnight UTC (Neon stores as timestamptz)
      results.push(d.toISOString().split('T')[0])
    }
  }
  return results
}

// ── Start from today ───────────────────────────────────────────────────────
const TODAY = new Date('2026-03-30T00:00:00.000Z')

// ── Static IDs for seeded records (predictable, upsert-friendly) ──────────
const IDS = {
  // Studios
  GALAW: 'seed-studio-galaw-bgc',
  ANINO: 'seed-studio-anino-wellness',

  // Rooms — Galaw
  GALAW_MAIN:      'seed-room-galaw-main',
  GALAW_REFORMER:  'seed-room-galaw-reformer',

  // Rooms — Anino
  ANINO_YOGA:      'seed-room-anino-yoga',
  ANINO_PILATES:   'seed-room-anino-pilates',

  // Service Types — Galaw
  ST_MAT:      'seed-st-galaw-mat',
  ST_REFORMER: 'seed-st-galaw-reformer',
  ST_VINYASA:  'seed-st-galaw-vinyasa',

  // Service Types — Anino
  ST_YIN:   'seed-st-anino-yin',
  ST_POWER: 'seed-st-anino-power',
  ST_BARRE: 'seed-st-anino-barre',
}

// ──────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🗑  Clearing old data (preserving users)…')

  // Delete in FK-safe order
  await sql`DELETE FROM "WaitlistEntry"`
  await sql`DELETE FROM "Booking"`
  await sql`DELETE FROM "Entitlement"`
  await sql`DELETE FROM "ClassSession"`
  await sql`DELETE FROM "SessionTemplate"`
  await sql`DELETE FROM "StudioInstructor"`
  await sql`DELETE FROM "Product"`
  await sql`DELETE FROM "ServiceType"`
  await sql`DELETE FROM "Room"`
  await sql`DELETE FROM "Studio"`

  console.log('✓ Cleared.\n')

  // ── Studios ──────────────────────────────────────────────────────────────
  console.log('🏢 Creating studios…')

  await sql`
    INSERT INTO "Studio" (id, name, description, address,
      "coordLat", "coordLng", timezone, "waitlistEnabled", "ownerId",
      "createdAt", "updatedAt")
    VALUES (
      ${IDS.GALAW},
      'Galaw BGC',
      'Premium Pilates and yoga studio in the heart of Bonifacio Global City. Small group classes, high-end reformers, and a community that moves together.',
      '4F High Street South Corporate Plaza, 26th St, Bonifacio Global City, Taguig, 1634 Metro Manila',
      14.5503, 121.0494,
      'Asia/Manila', true, ${OWNER_ID},
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `

  await sql`
    INSERT INTO "Studio" (id, name, description, address,
      "coordLat", "coordLng", timezone, "waitlistEnabled", "ownerId",
      "createdAt", "updatedAt")
    VALUES (
      ${IDS.ANINO},
      'Anino Wellness',
      'Your sanctuary for mindful movement in Ortigas. We offer yoga, barre, and mat Pilates in a calm, welcoming space designed for all levels.',
      '3F Estancia Mall, Capitol Commons, Meralco Ave, Pasig, 1605 Metro Manila',
      14.5872, 121.0716,
      'Asia/Manila', true, ${OWNER_ID},
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `

  // ── Rooms ─────────────────────────────────────────────────────────────────
  console.log('🚪 Creating rooms…')

  const rooms = [
    { id: IDS.GALAW_MAIN,     studioId: IDS.GALAW,  name: 'Main Studio',    capacity: 12 },
    { id: IDS.GALAW_REFORMER, studioId: IDS.GALAW,  name: 'Reformer Room',  capacity: 6  },
    { id: IDS.ANINO_YOGA,     studioId: IDS.ANINO,  name: 'Yoga Hall',      capacity: 15 },
    { id: IDS.ANINO_PILATES,  studioId: IDS.ANINO,  name: 'Pilates Studio', capacity: 10 },
  ]
  for (const r of rooms) {
    await sql`
      INSERT INTO "Room" (id, "studioId", name, capacity)
      VALUES (${r.id}, ${r.studioId}, ${r.name}, ${r.capacity})
      ON CONFLICT (id) DO NOTHING
    `
  }

  // ── Service Types ─────────────────────────────────────────────────────────
  console.log('🎨 Creating service types…')

  const serviceTypes = [
    { id: IDS.ST_MAT,      studioId: IDS.GALAW, name: 'Mat Pilates',       description: 'Core strength, mobility, and body awareness on the mat. Suitable for all levels.',    color: 'sage',  dur: 55 },
    { id: IDS.ST_REFORMER, studioId: IDS.GALAW, name: 'Reformer Pilates',  description: 'Machine-based resistance training for full-body conditioning. Beginner to advanced.', color: 'clay',  dur: 50 },
    { id: IDS.ST_VINYASA,  studioId: IDS.GALAW, name: 'Vinyasa Yoga',      description: 'Dynamic breath-linked flow that builds strength, flexibility, and mindfulness.',       color: 'blush', dur: 60 },
    { id: IDS.ST_YIN,      studioId: IDS.ANINO, name: 'Yin Yoga',          description: 'Deep, passive stretches held for 3–5 minutes. Targets connective tissue and joints.', color: 'sky',   dur: 75 },
    { id: IDS.ST_POWER,    studioId: IDS.ANINO, name: 'Power Yoga',        description: 'Strength-building, athletic yoga flow. Expect sweat and a serious challenge.',         color: 'sage',  dur: 60 },
    { id: IDS.ST_BARRE,    studioId: IDS.ANINO, name: 'Barre',             description: 'Ballet-inspired toning class combining small isometric movements with cardio bursts.', color: 'blush', dur: 55 },
  ]
  for (const s of serviceTypes) {
    await sql`
      INSERT INTO "ServiceType" (id, "studioId", name, description, color, "durationMinutes")
      VALUES (${s.id}, ${s.studioId}, ${s.name}, ${s.description}, ${s.color}, ${s.dur})
      ON CONFLICT (id) DO NOTHING
    `
  }

  // ── Products ──────────────────────────────────────────────────────────────
  console.log('💳 Creating products…')

  const products = [
    // Galaw BGC
    { id: 'seed-prod-galaw-1', studioId: IDS.GALAW, type: 'SINGLE_SESSION', name: 'Drop-in Class',   description: 'Pay-as-you-go single session.',         price: 750,  credits: null, sessionCount: 1,  validDays: 30 },
    { id: 'seed-prod-galaw-2', studioId: IDS.GALAW, type: 'CREDIT_PACK',    name: '5-Class Pack',    description: 'Save ₱250 — best for twice-a-weekers.', price: 3500, credits: 5,    sessionCount: null, validDays: 60 },
    { id: 'seed-prod-galaw-3', studioId: IDS.GALAW, type: 'CREDIT_PACK',    name: '10-Class Pack',   description: 'Save ₱750 — ideal for regulars.',        price: 6750, credits: 10,   sessionCount: null, validDays: 90 },
    // Anino Wellness
    { id: 'seed-prod-anino-1', studioId: IDS.ANINO, type: 'SINGLE_SESSION', name: 'Drop-in Class',   description: 'Single session, no commitment.',          price: 650,  credits: null, sessionCount: 1,  validDays: 30 },
    { id: 'seed-prod-anino-2', studioId: IDS.ANINO, type: 'CREDIT_PACK',    name: '5-Class Pack',    description: 'Perfect for trying different formats.',   price: 2900, credits: 5,    sessionCount: null, validDays: 60 },
    { id: 'seed-prod-anino-3', studioId: IDS.ANINO, type: 'CREDIT_PACK',    name: 'Monthly Unlimited', description: 'Unlimited classes for 30 days.',        price: 5500, credits: 999,  sessionCount: null, validDays: 30 },
  ]
  for (const p of products) {
    await sql`
      INSERT INTO "Product" (id, "studioId", type, name, description, price, credits, "sessionCount", "validDays", "isActive", "createdAt")
      VALUES (
        ${p.id}, ${p.studioId}, ${p.type}, ${p.name}, ${p.description},
        ${p.price}, ${p.credits}, ${p.sessionCount}, ${p.validDays}, true, NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `
  }

  // ── Studio Instructors ────────────────────────────────────────────────────
  console.log('👤 Assigning instructor…')
  await sql`
    INSERT INTO "StudioInstructor" ("studioId", "instructorId", "addedAt")
    VALUES (${IDS.GALAW}, ${INSTRUCTOR_ID}, NOW()),
           (${IDS.ANINO}, ${INSTRUCTOR_ID}, NOW())
    ON CONFLICT DO NOTHING
  `

  // ── Class Sessions ────────────────────────────────────────────────────────
  console.log('📅 Generating class sessions (14 days)…')

  /**
   * schedule entry: { studioId, serviceTypeId, roomId, startTime, daysOfWeek, capacity, instructorDOW }
   * instructorDOW: days when Anthony is assigned to this slot
   */
  const schedules = [
    // Galaw — Mat Pilates, Main Studio (cap 12)
    { studioId: IDS.GALAW, serviceId: IDS.ST_MAT,      roomId: IDS.GALAW_MAIN,     startTime: '07:00', dow: [1,3,5],   capacity: 12, instructorDOW: [1,3,5] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_MAT,      roomId: IDS.GALAW_MAIN,     startTime: '09:00', dow: [1,3,5],   capacity: 12, instructorDOW: [] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_MAT,      roomId: IDS.GALAW_MAIN,     startTime: '18:00', dow: [1,3,5],   capacity: 12, instructorDOW: [1,3,5] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_MAT,      roomId: IDS.GALAW_MAIN,     startTime: '08:00', dow: [6],       capacity: 12, instructorDOW: [6] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_MAT,      roomId: IDS.GALAW_MAIN,     startTime: '10:00', dow: [6],       capacity: 12, instructorDOW: [] },

    // Galaw — Reformer Pilates, Reformer Room (cap 6)
    { studioId: IDS.GALAW, serviceId: IDS.ST_REFORMER, roomId: IDS.GALAW_REFORMER, startTime: '08:00', dow: [1,3,5],   capacity: 6,  instructorDOW: [1,3,5] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_REFORMER, roomId: IDS.GALAW_REFORMER, startTime: '10:00', dow: [1,3,5],   capacity: 6,  instructorDOW: [] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_REFORMER, roomId: IDS.GALAW_REFORMER, startTime: '09:00', dow: [6],       capacity: 6,  instructorDOW: [6] },

    // Galaw — Vinyasa Yoga, Main Studio (cap 12)
    { studioId: IDS.GALAW, serviceId: IDS.ST_VINYASA,  roomId: IDS.GALAW_MAIN,     startTime: '07:00', dow: [2,4],     capacity: 12, instructorDOW: [] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_VINYASA,  roomId: IDS.GALAW_MAIN,     startTime: '09:00', dow: [2,4],     capacity: 12, instructorDOW: [2,4] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_VINYASA,  roomId: IDS.GALAW_MAIN,     startTime: '17:30', dow: [2,4],     capacity: 12, instructorDOW: [2,4] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_VINYASA,  roomId: IDS.GALAW_MAIN,     startTime: '09:00', dow: [0],       capacity: 12, instructorDOW: [] },
    { studioId: IDS.GALAW, serviceId: IDS.ST_VINYASA,  roomId: IDS.GALAW_MAIN,     startTime: '11:00', dow: [0],       capacity: 12, instructorDOW: [0] },

    // Anino — Yin Yoga, Yoga Hall (cap 15)
    { studioId: IDS.ANINO, serviceId: IDS.ST_YIN,      roomId: IDS.ANINO_YOGA,     startTime: '08:00', dow: [1,3,5],   capacity: 15, instructorDOW: [1,3,5] },
    { studioId: IDS.ANINO, serviceId: IDS.ST_YIN,      roomId: IDS.ANINO_YOGA,     startTime: '10:00', dow: [0,6],     capacity: 15, instructorDOW: [0,6] },
    { studioId: IDS.ANINO, serviceId: IDS.ST_YIN,      roomId: IDS.ANINO_YOGA,     startTime: '12:00', dow: [0,6],     capacity: 15, instructorDOW: [] },

    // Anino — Power Yoga, Yoga Hall (cap 15)
    { studioId: IDS.ANINO, serviceId: IDS.ST_POWER,    roomId: IDS.ANINO_YOGA,     startTime: '07:00', dow: [2,4],     capacity: 15, instructorDOW: [2,4] },
    { studioId: IDS.ANINO, serviceId: IDS.ST_POWER,    roomId: IDS.ANINO_YOGA,     startTime: '09:00', dow: [2,4],     capacity: 15, instructorDOW: [] },
    { studioId: IDS.ANINO, serviceId: IDS.ST_POWER,    roomId: IDS.ANINO_YOGA,     startTime: '18:00', dow: [2,4],     capacity: 15, instructorDOW: [2,4] },
    { studioId: IDS.ANINO, serviceId: IDS.ST_POWER,    roomId: IDS.ANINO_YOGA,     startTime: '08:00', dow: [6],       capacity: 15, instructorDOW: [6] },

    // Anino — Barre, Pilates Studio (cap 10)
    { studioId: IDS.ANINO, serviceId: IDS.ST_BARRE,    roomId: IDS.ANINO_PILATES,  startTime: '10:00', dow: [1,3],     capacity: 10, instructorDOW: [] },
    { studioId: IDS.ANINO, serviceId: IDS.ST_BARRE,    roomId: IDS.ANINO_PILATES,  startTime: '09:00', dow: [2,4,6],   capacity: 10, instructorDOW: [2,4,6] },
  ]

  // Lookup durations
  const durMap = {
    [IDS.ST_MAT]:      55,
    [IDS.ST_REFORMER]: 50,
    [IDS.ST_VINYASA]:  60,
    [IDS.ST_YIN]:      75,
    [IDS.ST_POWER]:    60,
    [IDS.ST_BARRE]:    55,
  }

  const sessionInserts = []

  for (const sched of schedules) {
    const dates = datesForDOW(sched.dow, TODAY, 14)
    for (const dateStr of dates) {
      const dow = new Date(dateStr + 'T00:00:00Z').getUTCDay()
      const instructorId = sched.instructorDOW.includes(dow) ? INSTRUCTOR_ID : ''
      const endTime = addMinutes(sched.startTime, durMap[sched.serviceId])
      const id = `sess-${dateStr}-${sched.serviceId.slice(-6)}-${sched.startTime.replace(':', '')}`
      sessionInserts.push({
        id,
        studioId: sched.studioId,
        serviceTypeId: sched.serviceId,
        roomId: sched.roomId,
        instructorId,
        date: dateStr,
        startTime: sched.startTime,
        endTime,
        capacity: sched.capacity,
      })
    }
  }

  for (const s of sessionInserts) {
    await sql`
      INSERT INTO "ClassSession"
        (id, "studioId", "serviceTypeId", "roomId", "instructorId",
         date, "startTime", "endTime", capacity, "bookedCount", "waitlistCount",
         status, "createdAt")
      VALUES (
        ${s.id}, ${s.studioId}, ${s.serviceTypeId}, ${s.roomId}, ${s.instructorId},
        ${s.date}::date, ${s.startTime}, ${s.endTime},
        ${s.capacity}, 0, 0, 'SCHEDULED', NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `
  }

  console.log(`✓ Inserted ${sessionInserts.length} sessions.`)

  // ── Sample Bookings for A.B. (customer) ──────────────────────────────────
  console.log('📋 Creating sample bookings for A.B.…')

  // Pick 3 specific upcoming sessions to book
  const bookingSessions = [
    `sess-2026-03-30-galaw-mat-0700`,  // today morning Mat Pilates
    `sess-2026-04-01-galaw-mat-1800`,  // Wed evening Mat Pilates
    `sess-2026-04-02-anino-power-0900`, // Thu morning Power Yoga
  ]

  // Use session IDs that actually exist from our generation
  // Recalculate actual IDs
  const ab_bookings = [
    { sessId: `sess-2026-03-30-${IDS.ST_MAT.slice(-6)}-0700` },
    { sessId: `sess-2026-04-01-${IDS.ST_MAT.slice(-6)}-1800` },
    { sessId: `sess-2026-04-02-${IDS.ST_POWER.slice(-6)}-0900` },
  ]

  for (const bk of ab_bookings) {
    const bookingId = `seed-booking-${bk.sessId.slice(-16)}`
    await sql`
      INSERT INTO "Booking" (id, "userId", "sessionId", status, "bookedAt", "chargeId")
      VALUES (${bookingId}, ${CUSTOMER_ID}, ${bk.sessId}, 'CONFIRMED', NOW(), '')
      ON CONFLICT (id) DO NOTHING
    `
    await sql`
      UPDATE "ClassSession" SET "bookedCount" = "bookedCount" + 1
      WHERE id = ${bk.sessId}
    `
  }

  // ── Wrap up ───────────────────────────────────────────────────────────────
  const [{ count: studioCount }] = await sql`SELECT COUNT(*) FROM "Studio"`
  const [{ count: sessionCount }] = await sql`SELECT COUNT(*) FROM "ClassSession"`
  const [{ count: bookingCount }] = await sql`SELECT COUNT(*) FROM "Booking"`

  console.log('\n✅ Seed complete!')
  console.log(`   Studios:       ${studioCount}`)
  console.log(`   Class sessions:${sessionCount}`)
  console.log(`   Bookings:      ${bookingCount}`)
}

main().catch(console.error)
