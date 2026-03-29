import { db } from '@/lib/db'

export function calcEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const totalMin = h * 60 + m + durationMinutes
  return `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`
}

type PendingSession = {
  studioId: string
  serviceTypeId: string
  roomId: string
  templateId: string
  date: Date
  startTime: string
  endTime: string
  capacity: number
}

// Filters out sessions that overlap with existing DB sessions in the same room on the same date.
// Overlap: newStart < existingEnd AND newEnd > existingStart (both HH:mm string-comparable)
export async function filterNonOverlapping(pending: PendingSession[]): Promise<{
  toCreate: PendingSession[]
  skipped: number
}> {
  if (!pending.length) return { toCreate: [], skipped: 0 }

  // Collect all unique roomId+date combos we need to check
  const roomDates = pending.map((s) => ({ roomId: s.roomId, date: s.date }))

  // Fetch all existing sessions for those rooms on those dates
  const dateSet = Array.from(new Set(roomDates.map((rd) => rd.date.toISOString())))
  const roomSet = Array.from(new Set(roomDates.map((rd) => rd.roomId)))

  const minDate = new Date(Math.min(...pending.map((s) => s.date.getTime())))
  const maxDate = new Date(Math.max(...pending.map((s) => s.date.getTime())))
  maxDate.setDate(maxDate.getDate() + 1) // exclusive upper bound

  const existing = await db.classSession.findMany({
    where: {
      roomId: { in: roomSet },
      date: { gte: minDate, lt: maxDate },
      status: { not: 'CANCELLED' },
    },
    select: { roomId: true, date: true, startTime: true, endTime: true },
  })

  // Build a lookup: roomId -> date-string -> [{startTime, endTime}]
  const lookup = new Map<string, { startTime: string; endTime: string }[]>()
  for (const ex of existing) {
    const key = `${ex.roomId}::${ex.date.toDateString()}`
    if (!lookup.has(key)) lookup.set(key, [])
    lookup.get(key)!.push({ startTime: ex.startTime, endTime: ex.endTime })
  }

  const toCreate: PendingSession[] = []
  let skipped = 0

  for (const session of pending) {
    const key = `${session.roomId}::${session.date.toDateString()}`
    const existingInRoom = lookup.get(key) ?? []

    const overlaps = existingInRoom.some(
      (ex) => session.startTime < ex.endTime && session.endTime > ex.startTime
    )

    if (overlaps) {
      skipped++
    } else {
      toCreate.push(session)
      // Add to lookup so subsequent sessions in the same batch are also checked
      existingInRoom.push({ startTime: session.startTime, endTime: session.endTime })
      lookup.set(key, existingInRoom)
    }
  }

  return { toCreate, skipped }
}
