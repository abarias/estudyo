'use client'

import { useEffect, useState, useMemo } from 'react'
import { format, isToday, isTomorrow } from 'date-fns'
import { Clock, Users, MapPin } from 'lucide-react'
import { DateStrip } from '@/components/studio'
import { Card } from '@/components/ui'

type InstructorSession = {
  id: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  waitlistCount: number
  status: string
  studioName: string
  serviceTypeName: string
  serviceTypeColor: string
}

export default function InstructorPage() {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [sessions, setSessions] = useState<InstructorSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/instructor/sessions?date=${selectedDate.toISOString()}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setSessions(data)
        setLoading(false)
      })
  }, [selectedDate])

  const dateLabel = isToday(selectedDate)
    ? `Today — ${format(selectedDate, 'EEEE, MMM d')}`
    : isTomorrow(selectedDate)
    ? `Tomorrow — ${format(selectedDate, 'EEEE, MMM d')}`
    : format(selectedDate, 'EEEE, MMM d')

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">My Schedule</h1>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <p className="text-muted text-sm">{dateLabel}</p>

      {loading ? (
        <p className="text-muted text-sm py-8 text-center">Loading...</p>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <p className="font-medium text-text">No sessions assigned</p>
          <p className="text-sm text-muted">You have no classes scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const spotsLeft = session.capacity - session.bookedCount
            return (
              <Card key={session.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: `var(--${session.serviceTypeColor})` }}
                      />
                      <p className="font-semibold text-text">{session.serviceTypeName}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted mt-0.5">
                      <MapPin size={13} />
                      {session.studioName}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <Clock size={14} />
                    {session.startTime} – {session.endTime}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted border-t border-border pt-2">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {session.bookedCount}/{session.capacity} booked
                    {spotsLeft > 0 && <span className="text-sage ml-1">({spotsLeft} open)</span>}
                  </span>
                  {session.waitlistCount > 0 && (
                    <span className="text-clay">{session.waitlistCount} waitlisted</span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
