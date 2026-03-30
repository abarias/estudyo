'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { format, isToday, isTomorrow } from 'date-fns'
import { Clock, Users, UserCheck } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { DateStrip } from '@/components/studio'
import { Card, Button } from '@/components/ui'

type StudioSession = {
  id: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  waitlistCount: number
  status: string
  serviceTypeName: string
  serviceTypeColor: string
  instructorId: string
  instructorName: string
}

type StudioInfo = {
  id: string
  name: string
}

export default function InstructorStudioPage() {
  const params = useParams()
  const studioId = params.studioId as string
  const { data: authSession } = useSession()
  const myUserId = authSession?.user?.id

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [sessions, setSessions] = useState<StudioSession[]>([])
  const [studio, setStudio] = useState<StudioInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)

  // Fetch studio info once
  useEffect(() => {
    fetch('/api/instructor/studios')
      .then(r => r.ok ? r.json() : [])
      .then((studios: StudioInfo[]) => {
        const found = studios.find(s => s.id === studioId)
        setStudio(found ?? null)
      })
  }, [studioId])

  // Fetch sessions when date changes
  useEffect(() => {
    setLoading(true)
    fetch(`/api/instructor/sessions?studioId=${studioId}&date=${selectedDate.toISOString()}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSessions(data); setLoading(false) })
  }, [studioId, selectedDate])

  const handleClaim = async (sessionId: string) => {
    setClaiming(sessionId)
    const res = await fetch(`/api/instructor/sessions/${sessionId}/claim`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (res.ok) {
      const data = await res.json()
      setSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, instructorId: data.instructorId, instructorName: data.instructorName }
        : s
      ))
    }
    setClaiming(null)
  }

  const handleUnclaim = async (sessionId: string) => {
    setClaiming(sessionId)
    const res = await fetch(`/api/instructor/sessions/${sessionId}/claim`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unclaim: true }),
    })
    if (res.ok) {
      setSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, instructorId: '', instructorName: '' }
        : s
      ))
    }
    setClaiming(null)
  }

  const dateLabel = isToday(selectedDate)
    ? `Today — ${format(selectedDate, 'EEEE, MMM d')}`
    : isTomorrow(selectedDate)
    ? `Tomorrow — ${format(selectedDate, 'EEEE, MMM d')}`
    : format(selectedDate, 'EEEE, MMM d')

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">{studio?.name ?? 'Studio'}</h1>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <p className="text-muted text-sm">{dateLabel}</p>

      {loading ? (
        <p className="text-muted text-sm py-8 text-center">Loading...</p>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <p className="font-medium text-text">No sessions</p>
          <p className="text-sm text-muted">No classes scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const spotsLeft = session.capacity - session.bookedCount
            const isMySession = session.instructorId === myUserId
            const isTaken = session.instructorId && session.instructorId !== '' && !isMySession
            const isPending = claiming === session.id

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
                      <Clock size={13} />
                      {session.startTime} – {session.endTime}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <Users size={14} />
                    {session.bookedCount}/{session.capacity}
                    {spotsLeft > 0 && <span className="text-sage ml-1">({spotsLeft} open)</span>}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2">
                  <div className="flex items-center gap-1 text-sm">
                    {isMySession ? (
                      <span className="flex items-center gap-1 text-sage font-medium">
                        <UserCheck size={14} />
                        You
                      </span>
                    ) : isTaken ? (
                      <span className="flex items-center gap-1 text-muted">
                        <UserCheck size={14} />
                        {session.instructorName}
                      </span>
                    ) : (
                      <span className="text-muted">No instructor</span>
                    )}
                  </div>

                  {isMySession ? (
                    <Button
                      variant="secondary"
                      className="text-xs py-1.5 px-3"
                      onClick={() => handleUnclaim(session.id)}
                      disabled={isPending}
                    >
                      {isPending ? 'Removing...' : 'Remove me'}
                    </Button>
                  ) : !isTaken ? (
                    <Button
                      variant="primary"
                      className="text-xs py-1.5 px-3"
                      onClick={() => handleClaim(session.id)}
                      disabled={isPending}
                    >
                      {isPending ? 'Claiming...' : 'Claim'}
                    </Button>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
