'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInHours } from 'date-fns'
import { getBookings, getSessions, getStudios, cancel, getWaitlistEntries, waitlistAccept, getEntitlements } from '@/lib/api'
import { POLICY } from '@/lib/mockStore'
import { Card, Chip, Button } from '@/components/ui'
import type { Booking, Session, Studio, WaitlistEntry, Entitlement } from '@/types/domain'

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [studios, setStudios] = useState<Studio[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [b, s, st, w, e] = await Promise.all([
      getBookings('user-1'),
      getSessions(),
      getStudios(),
      getWaitlistEntries('user-1'),
      getEntitlements('user-1'),
    ])
    setBookings(b)
    setSessions(s)
    setStudios(st)
    setWaitlist(w)
    setEntitlements(e)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getSession = (id: string) => sessions.find(s => s.id === id)
  const getStudio = (id: string) => studios.find(s => s.id === id)
  const getServiceType = (studioId: string, serviceTypeId: string) => {
    const studio = getStudio(studioId)
    return studio?.serviceTypes.find(st => st.id === serviceTypeId)
  }

  const now = new Date()
  const upcomingBookings = bookings.filter(b => {
    const session = getSession(b.sessionId)
    return session && session.date >= now && b.status === 'CONFIRMED'
  })
  const pastBookings = bookings.filter(b => {
    const session = getSession(b.sessionId)
    return session && (session.date < now || b.status !== 'CONFIRMED')
  })

  const offeredWaitlist = waitlist.filter(w => w.status === 'OFFERED')
  const displayBookings = tab === 'upcoming' ? upcomingBookings : pastBookings

  const canCancel = (session: Session): boolean => {
    const sessionDateTime = new Date(session.date)
    const [h, m] = session.startTime.split(':').map(Number)
    sessionDateTime.setHours(h, m)
    return differenceInHours(sessionDateTime, now) >= POLICY.cancelCutoffHours
  }

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId)
    const result = await cancel(bookingId)
    if (result.success) {
      await loadData()
    }
    setCancelling(null)
  }

  const handleAcceptOffer = async (entry: WaitlistEntry) => {
    if (entitlements.length === 0) {
      alert('No credits available. Please purchase a package first.')
      return
    }
    await waitlistAccept(entry.id, entitlements[0].id)
    await loadData()
  }

  const handleRebook = (session: Session) => {
    router.push(`/studios/${session.studioId}`)
  }

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">My Bookings</h1>

      {/* Waitlist offers */}
      {offeredWaitlist.length > 0 && (
        <Card className="bg-clay/10 border-clay/30">
          <p className="font-semibold text-text mb-2">Spot Available!</p>
          {offeredWaitlist.map((entry) => {
            const session = getSession(entry.sessionId)
            if (!session) return null
            const studio = getStudio(session.studioId)
            return (
              <div key={entry.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text">{studio?.name}</p>
                  <p className="text-xs text-muted">
                    {format(session.date, 'EEE, MMM d')} at {session.startTime}
                  </p>
                </div>
                <Button variant="primary" className="text-sm py-2" onClick={() => handleAcceptOffer(entry)}>
                  Accept
                </Button>
              </div>
            )
          })}
        </Card>
      )}

      <div className="flex gap-2">
        <Chip active={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          Upcoming ({upcomingBookings.length})
        </Chip>
        <Chip active={tab === 'past'} onClick={() => setTab('past')}>
          Past
        </Chip>
      </div>

      {displayBookings.length === 0 ? (
        <p className="text-muted text-sm py-8 text-center">
          {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
        </p>
      ) : (
        <div className="space-y-3">
          {displayBookings.map((booking) => {
            const session = getSession(booking.sessionId)
            const studio = session ? getStudio(session.studioId) : null
            const serviceType = session ? getServiceType(session.studioId, session.serviceTypeId) : null
            if (!session) return null

            const cancelable = booking.status === 'CONFIRMED' && canCancel(session)

            return (
              <Card key={booking.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {serviceType && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: `var(--${serviceType.color})` }}
                        />
                      )}
                      <p className="font-semibold text-text">{serviceType?.name || 'Class'}</p>
                    </div>
                    <p className="text-sm text-muted">{studio?.name}</p>
                    <p className="text-sm text-muted">
                      {format(session.date, 'EEE, MMM d')} at {session.startTime}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'CONFIRMED' ? 'bg-sage/20 text-sage' : 'bg-muted/20 text-muted'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                {tab === 'upcoming' && booking.status === 'CONFIRMED' && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm py-2"
                      onClick={() => handleCancel(booking.id)}
                      disabled={!cancelable || cancelling === booking.id}
                    >
                      {cancelling === booking.id ? 'Cancelling...' : cancelable ? 'Cancel' : `Cancel (>${POLICY.cancelCutoffHours}h)`}
                    </Button>
                  </div>
                )}

                {tab === 'past' && booking.status !== 'CONFIRMED' && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm py-2"
                    onClick={() => handleRebook(session)}
                  >
                    Rebook
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
