'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Clock, Users, MapPin } from 'lucide-react'
import { getSessions, getStudios } from '@/lib/api'
import { Card, Chip } from '@/components/ui'
import type { Session, Studio } from '@/types/domain'

export default function InstructorPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [viewAll, setViewAll] = useState(false)

  useEffect(() => {
    Promise.all([
      getSessions(),
      getStudios(),
    ]).then(([s, st]) => {
      // Mock: filter to instructor's sessions (instructor-1)
      setSessions(s.filter(sess => sess.instructorId === 'instructor-1'))
      setStudios(st)
      setLoading(false)
    })
  }, [])

  const getStudio = (id: string) => studios.find(s => s.id === id)
  const getServiceType = (studioId: string, serviceTypeId: string) => {
    const studio = getStudio(studioId)
    return studio?.serviceTypes.find(st => st.id === serviceTypeId)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todaySessions = sessions.filter(s => s.date.toDateString() === today.toDateString())
  const futureSessions = sessions.filter(s => s.date > today)
  const displaySessions = viewAll ? sessions : todaySessions

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">My Schedule</h1>
      <p className="text-muted text-sm">Your assigned sessions</p>

      <div className="flex gap-2">
        <Chip active={!viewAll} onClick={() => setViewAll(false)}>
          Today ({todaySessions.length})
        </Chip>
        <Chip active={viewAll} onClick={() => setViewAll(true)}>
          All ({sessions.length})
        </Chip>
      </div>

      {displaySessions.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-muted">No sessions {viewAll ? 'assigned' : 'today'}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displaySessions.map((session) => {
            const studio = getStudio(session.studioId)
            const serviceType = getServiceType(session.studioId, session.serviceTypeId)
            const room = studio?.rooms.find(r => r.id === session.roomId)
            
            return (
              <Card key={session.id} className="space-y-2">
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
                    <div className="flex items-center gap-1 text-sm text-muted mt-1">
                      <MapPin size={12} />
                      <span>{studio?.name} - {room?.name}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    session.bookedCount >= session.capacity * 0.8 
                      ? 'bg-sage/20 text-sage' 
                      : 'bg-muted/10 text-muted'
                  }`}>
                    {session.bookedCount >= session.capacity ? 'Full' : `${session.bookedCount}/${session.capacity}`}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>{format(session.date, 'EEE, MMM d')}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {session.startTime} - {session.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {session.bookedCount} booked
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {!viewAll && futureSessions.length > 0 && (
        <p className="text-sm text-muted text-center">
          +{futureSessions.length} more sessions this week
        </p>
      )}
    </div>
  )
}
