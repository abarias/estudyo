'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Users, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { getSessions, getStudios, getBookings, ownerSimulateSlotOpened, getWaitlistEntries } from '@/lib/api'
import { AttendeeSheet, OwnerSetupPanel } from '@/components/owner'
import { Card, Button } from '@/components/ui'
import type { Session, Studio, Booking, WaitlistEntry } from '@/types/domain'

export default function OwnerPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [studios, setStudios] = useState<Studio[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState<string | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const loadData = useCallback(async () => {
    const [s, st, b, w] = await Promise.all([
      getSessions({ date: today }),
      getStudios(),
      getBookings('user-1'),
      getWaitlistEntries('user-1'),
    ])
    setSessions(s)
    setStudios(st)
    setBookings(b)
    setWaitlist(w)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getStudio = (id: string) => studios.find(s => s.id === id)
  const getServiceName = (studioId: string, serviceTypeId: string) => {
    const studio = getStudio(studioId)
    return studio?.serviceTypes.find(st => st.id === serviceTypeId)?.name || 'Class'
  }
  const getServiceColor = (studioId: string, serviceTypeId: string) => {
    const studio = getStudio(studioId)
    return studio?.serviceTypes.find(st => st.id === serviceTypeId)?.color || 'muted'
  }

  const getSessionBookings = (sessionId: string) => {
    return bookings.filter(b => b.sessionId === sessionId)
  }

  const getSessionWaitlist = (sessionId: string) => {
    return waitlist.filter(w => w.sessionId === sessionId && w.status === 'WAITING')
  }

  const handleViewAttendees = (session: Session) => {
    setSelectedSession(session)
    setSheetOpen(true)
  }

  const handleSimulateSlot = async (sessionId: string) => {
    setSimulating(sessionId)
    const entry = await ownerSimulateSlotOpened(sessionId)
    if (entry) {
      alert(`Offer sent to waitlist position ${entry.position}!`)
    } else {
      alert('No one on waitlist')
    }
    await loadData()
    setSimulating(null)
  }

  const handleCreateService = (name: string, duration: number) => {
    alert(`Mock: Created service "${name}" (${duration} min)`)
  }

  const handleRegenerateSessions = () => {
    alert('Mock: Sessions regenerated')
  }

  // Show offered waitlist entries
  const offeredEntries = waitlist.filter(w => w.status === 'OFFERED')

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">Owner Dashboard</h1>
      <p className="text-muted text-sm">Today&apos;s Sessions - {format(today, 'EEEE, MMM d')}</p>

      {/* Offered waitlist notification */}
      {offeredEntries.length > 0 && (
        <Card className="bg-clay/10 border-clay/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-clay flex-shrink-0" size={18} />
            <div>
              <p className="font-medium text-text text-sm">Waitlist Offers Pending</p>
              <p className="text-xs text-muted">
                {offeredEntries.length} customer(s) have pending slot offers
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {sessions.map((session) => {
          const sessionWaitlist = getSessionWaitlist(session.id)
          const hasWaitlist = sessionWaitlist.length > 0

          return (
            <Card key={session.id} className="space-y-3">
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => handleViewAttendees(session)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: `var(--${getServiceColor(session.studioId, session.serviceTypeId)})` }}
                    />
                    <p className="font-semibold text-text">
                      {getServiceName(session.studioId, session.serviceTypeId)}
                    </p>
                  </div>
                  <p className="text-sm text-muted">{getStudio(session.studioId)?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <Clock size={14} />
                    {session.startTime}
                  </span>
                  <ChevronRight className="text-muted" size={18} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-muted">
                    <Users size={14} />
                    {session.bookedCount}/{session.capacity} booked
                  </span>
                  {session.waitlistCount > 0 && (
                    <span className="text-clay">{session.waitlistCount} waitlisted</span>
                  )}
                </div>

                {hasWaitlist && (
                  <Button
                    variant="secondary"
                    className="text-xs py-1.5 px-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSimulateSlot(session.id)
                    }}
                    disabled={simulating === session.id}
                  >
                    {simulating === session.id ? 'Offering...' : 'Offer Spot'}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <OwnerSetupPanel
        onCreateService={handleCreateService}
        onRegenerateSessions={handleRegenerateSessions}
      />

      <AttendeeSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        session={selectedSession}
        bookings={selectedSession ? getSessionBookings(selectedSession.id) : []}
      />
    </div>
  )
}
