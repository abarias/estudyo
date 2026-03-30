'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Users, Clock } from 'lucide-react'
import { Card } from '@/components/ui'

type Tab = 'upcoming' | 'past'

type SessionRow = {
  id: string
  studioId: string
  studioName: string
  serviceTypeId: string
  serviceTypeName: string
  serviceTypeColor: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  confirmedCount: number
  cancelledCount: number
}

type OwnerBookingsData = {
  stats: { confirmed: number; cancelled: number }
  sessions: SessionRow[]
}

export default function OwnerBookingsPage() {
  const [data, setData] = useState<OwnerBookingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('upcoming')

  useEffect(() => {
    fetch('/api/owner/bookings')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  const upcoming = (data?.sessions ?? []).filter((s) => {
    const [h, m] = s.startTime.split(':').map(Number)
    const dt = new Date(s.date)
    dt.setHours(h, m, 0, 0)
    return dt >= now
  })

  const past = (data?.sessions ?? []).filter((s) => {
    const [h, m] = s.startTime.split(':').map(Number)
    const dt = new Date(s.date)
    dt.setHours(h, m, 0, 0)
    return dt < now
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
          <p className="text-2xl font-bold text-text">{data?.stats.confirmed ?? 0}</p>
          <p className="text-xs text-muted mt-0.5">Confirmed</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-text">{data?.stats.cancelled ?? 0}</p>
          <p className="text-xs text-muted mt-0.5">Cancelled</p>
        </Card>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">
          No {tab} bookings
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((session) => (
            <Card key={session.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `var(--${session.serviceTypeColor})` }}
                    />
                    <p className="font-semibold text-text text-sm">{session.serviceTypeName}</p>
                  </div>
                  <p className="text-xs text-muted">{session.studioName}</p>
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
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {session.confirmedCount} confirmed
                </span>
                {session.cancelledCount > 0 && (
                  <span>{session.cancelledCount} cancelled</span>
                )}
                <span className="ml-auto">{session.confirmedCount}/{session.capacity} spots filled</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
