'use client'

import { Clock, Users, UserCheck } from 'lucide-react'
import type { Session, ServiceType } from '@/types/domain'
import { Card, Button } from '@/components/ui'

interface SessionCardProps {
  session: Session
  serviceType?: ServiceType
  onBook: () => void
  onLeaveWaitlist?: () => void
  isBooked?: boolean
  isOnWaitlist?: boolean
  waitlistEnabled?: boolean
}

export default function SessionCard({ session, serviceType, onBook, onLeaveWaitlist, isBooked, isOnWaitlist, waitlistEnabled = true }: SessionCardProps) {
  const spotsLeft = session.capacity - session.bookedCount
  const isFull = spotsLeft <= 0

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: serviceType ? `var(--${serviceType.color})` : 'var(--muted)' }}
            />
            <h3 className="font-semibold text-text">{serviceType?.name || 'Class'}</h3>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {session.startTime} - {session.endTime}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} />
              {spotsLeft > 0 ? `${spotsLeft} spots` : 'Full'}
            </span>
          </div>
          {session.instructorName && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted">
              <UserCheck size={12} />
              {session.instructorName}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {session.waitlistCount > 0 && !isOnWaitlist && (
          <span className="text-xs text-muted">{session.waitlistCount} on waitlist</span>
        )}
        <div className="ml-auto">
          {isBooked ? (
            <span className="text-sm text-sage font-medium">Booked</span>
          ) : isOnWaitlist ? (
            <Button
              variant="secondary"
              onClick={onLeaveWaitlist}
              className="text-sm py-2"
            >
              Leave Waitlist
            </Button>
          ) : isFull && !waitlistEnabled ? null : (
            <Button
              variant={isFull ? 'secondary' : 'primary'}
              onClick={onBook}
              className="text-sm py-2"
            >
              {isFull ? 'Join Waitlist' : 'Book'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
