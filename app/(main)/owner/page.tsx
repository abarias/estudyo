'use client'

import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Users, Clock, ChevronRight, AlertCircle, RotateCcw, Settings, FlaskConical } from 'lucide-react'
import { useStore } from '@/lib/store'
import { ownerSimulateSlotOpened } from '@/lib/api'
import { AttendeeSheet, OwnerSetupPanel } from '@/components/owner'
import { Card, Button, Banner } from '@/components/ui'
import type { Session } from '@/types/domain'
import type { ScenarioId } from '@/lib/store/scenariosSlice'

const SCENARIOS: { id: ScenarioId; name: string }[] = [
  { id: 1, name: 'Credits Available' },
  { id: 2, name: 'No Entitlements' },
  { id: 3, name: 'Full Class + Waitlist' },
  { id: 4, name: 'Waitlist Offer' },
  { id: 5, name: 'Locked Cancel' },
]

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

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      await Promise.all([
        loadSessions({ date: today }),
        loadStudios(),
        loadBookings(),
        loadWaitlist(),
      ])
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [today])

  const getStudio = (id: string) => studios.find(s => s.id === id)
  const getServiceName = (studioId: string, serviceTypeId: string) => {
    return getServiceType(studioId, serviceTypeId)?.name || 'Class'
  }
  const getServiceColor = (studioId: string, serviceTypeId: string) => {
    return getServiceType(studioId, serviceTypeId)?.color || 'muted'
  }

  const getSessionBookings = (sessionId: string) => {
    return bookings.filter(b => b.sessionId === sessionId && b.status === 'CONFIRMED')
  }

  const getSessionWaitlist = (sessionId: string) => {
    return waitlistEntries.filter(w => w.sessionId === sessionId && w.status === 'WAITING')
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
      await loadWaitlist()
    } else {
      alert('No one on waitlist')
    }
    setSimulating(null)
  }

  const handleCreateService = (name: string, duration: number) => {
    alert(`Mock: Created service "${name}" (${duration} min)`)
  }

  const handleRegenerateSessions = () => {
    alert('Mock: Sessions regenerated')
  }

  const offeredEntries = waitlistEntries.filter(w => w.status === 'OFFERED')
  const activeScenario = useStore((s) => s.activeScenario)
  const loadScenario = useStore((s) => s.loadScenario)
  const scenarioLoading = useStore((s) => s.scenarioLoading)
  const resetDemoData = useStore((s) => s.resetDemoData)
  const [showScenarios, setShowScenarios] = useState(false)

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      {/* Demo Mode Banner */}
      <div className="bg-sage/10 border border-sage/30 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-sage" />
            <span className="text-sm font-medium text-text">
              Demo Mode {activeScenario ? `• Scenario ${activeScenario}` : ''}
            </span>
          </div>
          <button
            onClick={() => setShowScenarios(!showScenarios)}
            className="text-xs text-sage underline"
          >
            {showScenarios ? 'Hide' : 'Change Scenario'}
          </button>
        </div>
        {showScenarios && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => loadScenario(s.id)}
                disabled={scenarioLoading}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  activeScenario === s.id
                    ? 'bg-sage text-white'
                    : 'bg-border text-muted hover:bg-sage/20'
                }`}
              >
                {s.id}. {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Owner Dashboard</h1>
        <div className="flex gap-2">
          <a href="/owner/setup">
            <Button variant="ghost" className="px-2">
              <Settings size={18} />
            </Button>
          </a>
          <Button variant="ghost" className="px-2" onClick={resetDemoData}>
            <RotateCcw size={18} />
          </Button>
        </div>
      </div>
      <p className="text-muted text-sm">Today&apos;s Sessions - {format(today, 'EEEE, MMM d')}</p>

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
