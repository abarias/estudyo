'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInHours } from 'date-fns'
import { useStore } from '@/lib/store'
import { POLICY } from '@/lib/mockStore'
import { Card, Chip, Button } from '@/components/ui'

export default function BookingsPage() {
  const router = useRouter()
  
  const bookings = useStore((s) => s.bookings)
  const loadBookings = useStore((s) => s.loadBookings)
  const cancelBooking = useStore((s) => s.cancelBooking)
  const sessions = useStore((s) => s.sessions)
  const loadSessions = useStore((s) => s.loadSessions)
  const studios = useStore((s) => s.studios)
  const loadStudios = useStore((s) => s.loadStudios)
  const getServiceType = useStore((s) => s.getServiceType)
  const waitlistEntries = useStore((s) => s.waitlistEntries)
  const loadWaitlist = useStore((s) => s.loadWaitlist)
  const acceptWaitlistOffer = useStore((s) => s.acceptWaitlistOffer)
  const entitlements = useStore((s) => s.entitlements)
  const loadWallet = useStore((s) => s.loadWallet)
  const pendingOperations = useStore((s) => s.pendingOperations)

  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      await Promise.all([
        loadBookings(),
        loadSessions(),
        loadStudios(),
        loadWaitlist(),
        loadWallet(),
      ])
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const getSession = (id: string) => sessions.find(s => s.id === id)
  const getStudio = (id: string) => studios.find(s => s.id === id)

  const now = new Date()
  const upcomingBookings = bookings.filter(b => {
    const session = getSession(b.sessionId)
    return session && session.date >= now && b.status === 'CONFIRMED'
  })
  const pastBookings = bookings.filter(b => {
    const session = getSession(b.sessionId)
    return session && (session.date < now || b.status !== 'CONFIRMED')
  })

  const offeredWaitlist = waitlistEntries.filter(w => w.status === 'OFFERED')
  const displayBookings = tab === 'upcoming' ? upcomingBookings : pastBookings

  const canCancel = (sessionDate: Date, startTime: string): boolean => {
    const sessionDateTime = new Date(sessionDate)
    const [h, m] = startTime.split(':').map(Number)
    sessionDateTime.setHours(h, m)
    return differenceInHours(sessionDateTime, now) >= POLICY.cancelCutoffHours
  }

  const handleCancel = async (bookingId: string) => {
    await cancelBooking(bookingId)
  }

  const handleAcceptOffer = async (entryId: string) => {
    if (entitlements.length === 0 || entitlements[0].remaining < 1) {
      alert('No credits available. Please purchase a package first.')
      return
    }
    await acceptWaitlistOffer(entryId, entitlements[0].id)
  }

  const handleRebook = (studioId: string) => {
    router.push(`/studios/${studioId}`)
  }

  const isPending = (type: string, id: string) => 
    pendingOperations.some(op => op.type === type && op.id.includes(id) && op.status === 'pending')

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
            const pending = isPending('waitlist-accept', entry.id)
            return (
              <div key={entry.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text">{studio?.name}</p>
                  <p className="text-xs text-muted">
                    {format(session.date, 'EEE, MMM d')} at {session.startTime}
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="text-sm py-2"
                  onClick={() => handleAcceptOffer(entry.id)}
                  disabled={pending}
                >
                  {pending ? 'Accepting...' : 'Accept'}
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

            const cancelable = booking.status === 'CONFIRMED' && canCancel(session.date, session.startTime)
            const pending = isPending('cancel', booking.id)

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
                      disabled={!cancelable || pending}
                    >
                      {pending ? 'Cancelling...' : cancelable ? 'Cancel' : `Cancel (>${POLICY.cancelCutoffHours}h)`}
                    </Button>
                  </div>
                )}

                {tab === 'past' && booking.status !== 'CONFIRMED' && studio && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm py-2"
                    onClick={() => handleRebook(studio.id)}
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
