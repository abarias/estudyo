'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Users, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card } from '@/components/ui'

type Tab = 'upcoming' | 'past'

export default function OwnerBookingsPage() {
  const sessions = useStore((s) => s.sessions)
  const loadSessions = useStore((s) => s.loadSessions)
  const bookings = useStore((s) => s.bookings)
  const loadBookings = useStore((s) => s.loadBookings)
  const studios = useStore((s) => s.studios)
  const loadStudios = useStore((s) => s.loadStudios)
  const getServiceType = useStore((s) => s.getServiceType)

  const [tab, setTab] = useState<Tab>('upcoming')
  const [loading, setLoading] = useState(true)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      // Load sessions for a broader range: past 7 days + next 14 days
      const past = new Date(today)
      past.setDate(past.getDate() - 7)
      await Promise.all([
        loadSessions({ date: today }),
        loadStudios(),
        loadBookings(),
      ])
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const now = new Date()

  const sessionsWithBookings = sessions
    .map((session) => {
      const confirmed = bookings.filter(
        (b) => b.sessionId === session.id && b.status === 'CONFIRMED'
      )
      return { session, confirmed }
    })
    .filter(({ confirmed }) => confirmed.length > 0)

  const upcoming = sessionsWithBookings.filter(({ session }) => {
    const [h, m] = session.startTime.split(':').map(Number)
    const sessionDate = new Date(session.date)
    sessionDate.setHours(h, m, 0, 0)
    return sessionDate >= now
  })

  const past = sessionsWithBookings.filter(({ session }) => {
    const [h, m] = session.startTime.split(':').map(Number)
    const sessionDate = new Date(session.date)
    sessionDate.setHours(h, m, 0, 0)
    return sessionDate < now
  })

  const items = tab === 'upcoming' ? upcoming : past

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              tab === t ? 'bg-sage text-white' : 'text-muted hover:text-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-text">
            {bookings.filter((b) => b.status === 'CONFIRMED').length}
          </p>
          <p className="text-xs text-muted mt-0.5">Confirmed</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-text">
            {bookings.filter((b) => b.status === 'CANCELLED').length}
          </p>
          <p className="text-xs text-muted mt-0.5">Cancelled</p>
        </Card>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">
          No {tab} bookings
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ session, confirmed }) => {
            const studio = studios.find((s) => s.id === session.studioId)
            const service = getServiceType(session.studioId, session.serviceTypeId)
            return (
              <Card key={session.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {service && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `var(--${service.color})` }}
                        />
                      )}
                      <p className="font-semibold text-text text-sm">
                        {service?.name ?? 'Class'}
                      </p>
                    </div>
                    <p className="text-xs text-muted">{studio?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted flex items-center gap-1 justify-end">
                      <Clock size={12} />
                      {session.startTime}
                    </p>
                    <p className="text-xs text-muted flex items-center gap-1 justify-end mt-0.5">
                      <Calendar size={12} />
                      {format(new Date(session.date), 'MMM d')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Users size={12} />
                  <span>{confirmed.length} confirmed booking{confirmed.length !== 1 ? 's' : ''}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
