'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, differenceInHours, isSameDay, isToday,
  startOfMonth, getDaysInMonth, getDay, addMonths, subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { POLICY } from '@/lib/mockStore'
import { Card, Chip, Button } from '@/components/ui'
import type { Booking } from '@/types/domain'

type Tab = 'upcoming' | 'past' | 'calendar'

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

  const [tab, setTab] = useState<Tab>('upcoming')
  const [loading, setLoading] = useState(true)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

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

  // Days in the current calendar month that have at least one booking
  const bookedDays = useMemo(() => {
    return bookings.reduce<Set<string>>((acc, b) => {
      const session = getSession(b.sessionId)
      if (session && b.status === 'CONFIRMED') {
        acc.add(session.date.toDateString())
      }
      return acc
    }, new Set())
  }, [bookings, sessions])

  // Bookings for the selected calendar day
  const selectedDayBookings = useMemo(() => {
    if (!selectedDay) return []
    return bookings.filter(b => {
      const session = getSession(b.sessionId)
      return session && isSameDay(session.date, selectedDay)
    })
  }, [selectedDay, bookings, sessions])

  // Calendar grid: blank leading cells + day numbers
  const calendarDays = useMemo(() => {
    const firstDow = getDay(startOfMonth(calendarMonth)) // 0=Sun
    const totalDays = getDaysInMonth(calendarMonth)
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ]
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [calendarMonth])

  const canCancel = (sessionDate: Date, startTime: string): boolean => {
    const dt = new Date(sessionDate)
    const [h, m] = startTime.split(':').map(Number)
    dt.setHours(h, m)
    return differenceInHours(dt, now) >= POLICY.cancelCutoffHours
  }

  const handleCancel = async (bookingId: string) => {
    await cancelBooking(bookingId)
    setConfirmCancelId(null)
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

  // ── Shared booking tile ──────────────────────────────────────────────────
  const renderBookingTile = (booking: Booking, context: 'upcoming' | 'past' | 'calendar') => {
    const session = getSession(booking.sessionId)
    const studio = session ? getStudio(session.studioId) : null
    const serviceType = session ? getServiceType(session.studioId, session.serviceTypeId) : null
    if (!session) return null

    const cancelable = booking.status === 'CONFIRMED' && canCancel(session.date, session.startTime)
    const pending = isPending('cancel', booking.id)
    const isUpcoming = session.date >= now && booking.status === 'CONFIRMED'

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

        {isUpcoming && booking.status === 'CONFIRMED' && (
          confirmCancelId === booking.id ? (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted">
                Are you sure you want to cancel?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 text-sm py-2"
                  onClick={() => setConfirmCancelId(null)}
                >
                  Keep
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 text-sm py-2 bg-blush hover:bg-blush/90"
                  onClick={() => handleCancel(booking.id)}
                  disabled={pending}
                >
                  {pending ? 'Cancelling...' : 'Yes, Cancel'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 text-sm py-2"
                onClick={() => setConfirmCancelId(booking.id)}
                disabled={!cancelable || pending}
              >
                {pending ? 'Cancelling...' : cancelable ? 'Cancel' : `Cancel (>${POLICY.cancelCutoffHours}h)`}
              </Button>
            </div>
          )
        )}

        {!isUpcoming && booking.status !== 'CONFIRMED' && studio && (
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
  }

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

      {/* Tabs */}
      <div className="flex gap-2">
        <Chip active={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          Upcoming ({upcomingBookings.length})
        </Chip>
        <Chip active={tab === 'past'} onClick={() => setTab('past')}>
          Past
        </Chip>
        <Chip active={tab === 'calendar'} onClick={() => setTab('calendar')}>
          Calendar
        </Chip>
      </div>

      {/* ── Calendar view ─────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <button
                onClick={() => { setCalendarMonth(m => subMonths(m, 1)); setSelectedDay(null) }}
                className="p-1 rounded-lg hover:bg-border transition-colors"
              >
                <ChevronLeft size={18} className="text-muted" />
              </button>
              <span className="font-semibold text-text">
                {format(calendarMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => { setCalendarMonth(m => addMonths(m, 1)); setSelectedDay(null) }}
                className="p-1 rounded-lg hover:bg-border transition-colors"
              >
                <ChevronRight size={18} className="text-muted" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 px-3 pb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 px-3 pb-4 gap-y-1">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`blank-${i}`} />
                }

                const cellDate = new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth(),
                  day
                )
                const hasBooking = bookedDays.has(cellDate.toDateString())
                const isSelected = selectedDay ? isSameDay(cellDate, selectedDay) : false
                const todayCell = isToday(cellDate)

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : cellDate)}
                    className={`
                      relative flex flex-col items-center justify-center h-10 w-full rounded-xl text-sm font-medium transition-all
                      ${isSelected
                        ? 'bg-sage text-white'
                        : todayCell
                        ? 'border border-sage text-sage'
                        : 'text-text hover:bg-border/60'}
                    `}
                  >
                    {day}
                    {hasBooking && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-sage'
                      }`} />
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Bookings for selected day */}
          {selectedDay && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted">
                {format(selectedDay, 'EEEE, MMMM d')}
              </p>
              {selectedDayBookings.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">
                  No bookings on this day
                </p>
              ) : (
                selectedDayBookings.map(b => renderBookingTile(b, 'calendar'))
              )}
            </div>
          )}

          {!selectedDay && (
            <p className="text-sm text-muted text-center py-4">
              Tap a highlighted day to see your bookings
            </p>
          )}
        </div>
      )}

      {/* ── Upcoming / Past list view ──────────────────────────────────── */}
      {tab !== 'calendar' && (
        displayBookings.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center">
            {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          </p>
        ) : (
          <div className="space-y-3">
            {displayBookings.map(b => renderBookingTile(b, tab))}
          </div>
        )
      )}
    </div>
  )
}
