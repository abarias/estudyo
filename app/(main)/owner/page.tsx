'use client'

import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Users, Clock, ChevronRight, AlertCircle, Settings, Zap, UserCheck, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { ownerSimulateSlotOpened } from '@/lib/api'
import { AttendeeSheet } from '@/components/owner'
import { DateStrip } from '@/components/studio'
import { Card, Button } from '@/components/ui'
import { BottomSheet } from '@/components/ui'
import type { Session } from '@/types/domain'

type Instructor = { id: string; name: string | null; email: string | null; image: string | null }

export default function OwnerPage() {
  const sessions = useStore((s) => s.sessions)
  const loadSessions = useStore((s) => s.loadSessions)
  const studios = useStore((s) => s.studios)
  const loadStudios = useStore((s) => s.loadStudios)
  const getServiceType = useStore((s) => s.getServiceType)
  const bookings = useStore((s) => s.bookings)
  const loadBookings = useStore((s) => s.loadBookings)
  const waitlistEntries = useStore((s) => s.waitlistEntries)
  const loadWaitlist = useStore((s) => s.loadWaitlist)

  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState<string | null>(null)

  // Instructor assignment state
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [assignSession, setAssignSession] = useState<Session | null>(null)
  const [assignSheetOpen, setAssignSheetOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  // Local instructor name overrides after assignment
  const [instructorOverrides, setInstructorOverrides] = useState<Record<string, string>>({})

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [selectedDate, setSelectedDate] = useState<Date>(today)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      await Promise.all([
        loadSessions({ date: selectedDate }),
        loadStudios(),
        loadBookings(),
        loadWaitlist(),
      ])
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [selectedDate])

  useEffect(() => {
    fetch('/api/owner/instructors')
      .then(r => r.ok ? r.json() : [])
      .then(setInstructors)
  }, [])

  const getStudio = (id: string) => studios.find(s => s.id === id)
  const getServiceName = (studioId: string, serviceTypeId: string) =>
    getServiceType(studioId, serviceTypeId)?.name || 'Class'
  const getServiceColor = (studioId: string, serviceTypeId: string) =>
    getServiceType(studioId, serviceTypeId)?.color || 'muted'
  const getSessionBookings = (sessionId: string) =>
    bookings.filter(b => b.sessionId === sessionId && b.status === 'CONFIRMED')
  const getSessionWaitlist = (sessionId: string) =>
    waitlistEntries.filter(w => w.sessionId === sessionId && w.status === 'WAITING')

  const handleViewAttendees = (session: Session) => {
    setSelectedSession(session)
    setSheetOpen(true)
  }

  const handleSimulateSlot = async (sessionId: string) => {
    setSimulating(sessionId)
    const entry = await ownerSimulateSlotOpened(sessionId)
    if (entry) {
      alert(`Offer sent to waitlist position ${entry.position}!`)
      await loadWaitlist()
    } else {
      alert('No one on waitlist')
    }
    setSimulating(null)
  }

  const handleOpenAssign = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation()
    setAssignSession(session)
    setAssignSheetOpen(true)
  }

  const handleAssign = async (instructorId: string, instructorName: string) => {
    if (!assignSession) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/owner/sessions/${assignSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId }),
      })
      if (res.ok) {
        setInstructorOverrides(prev => ({ ...prev, [assignSession.id]: instructorName }))
        setAssignSheetOpen(false)
      }
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async (e: React.MouseEvent, session: Session) => {
    e.stopPropagation()
    await fetch(`/api/owner/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructorId: '' }),
    })
    setInstructorOverrides(prev => ({ ...prev, [session.id]: '' }))
  }

  const getInstructorName = (session: Session) => {
    if (session.id in instructorOverrides) return instructorOverrides[session.id]
    return session.instructorName ?? ''
  }

  const offeredEntries = waitlistEntries.filter(w => w.status === 'OFFERED')

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Schedule</h1>
        <div className="flex gap-1">
          <a href="/owner/generate">
            <Button variant="ghost" className="px-2">
              <Zap size={18} />
            </Button>
          </a>
          <a href="/owner/setup">
            <Button variant="ghost" className="px-2">
              <Settings size={18} />
            </Button>
          </a>
        </div>
      </div>
      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <p className="text-muted text-sm">
        {selectedDate.toDateString() === today.toDateString()
          ? `Today — ${format(selectedDate, 'EEEE, MMM d')}`
          : format(selectedDate, 'EEEE, MMM d')}
      </p>

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
          const instructorName = getInstructorName(session)

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

              {/* Instructor row */}
              <div className="flex items-center justify-between text-sm border-t border-border pt-2">
                <div className="flex items-center gap-1.5 text-muted">
                  <UserCheck size={14} />
                  {instructorName
                    ? <span className="text-text font-medium">{instructorName}</span>
                    : <span className="text-muted italic">No instructor assigned</span>
                  }
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="text-xs text-sage underline"
                    onClick={(e) => handleOpenAssign(e, session)}
                  >
                    {instructorName ? 'Change' : 'Assign'}
                  </button>
                  {instructorName && (
                    <button
                      className="text-muted hover:text-blush ml-1"
                      onClick={(e) => handleUnassign(e, session)}
                    >
                      <X size={13} />
                    </button>
                  )}
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

      <AttendeeSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        session={selectedSession}
        bookings={selectedSession ? getSessionBookings(selectedSession.id) : []}
      />

      {/* Assign instructor sheet */}
      <BottomSheet
        open={assignSheetOpen}
        onClose={() => setAssignSheetOpen(false)}
        title="Assign Instructor"
      >
        {instructors.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted text-sm">No instructors available.</p>
            <p className="text-xs text-muted mt-1">Users must sign up with the Instructor role.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {instructors.map((instructor) => (
              <button
                key={instructor.id}
                disabled={assigning}
                onClick={() => handleAssign(instructor.id, instructor.name ?? instructor.email ?? '')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors text-left"
              >
                {instructor.image ? (
                  <img src={instructor.image} className="w-9 h-9 rounded-full" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-sage/20 flex items-center justify-center text-sage font-semibold text-sm">
                    {(instructor.name ?? instructor.email ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-text text-sm">{instructor.name ?? 'Unnamed'}</p>
                  <p className="text-xs text-muted">{instructor.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
