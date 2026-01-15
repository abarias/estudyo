'use client'

import { Clock, Users } from 'lucide-react'
import type { Session, ServiceType } from '@/types/domain'
import { Card, Button } from '@/components/ui'

interface SessionCardProps {
  session: Session
  serviceType?: ServiceType
  onBook: () => void
  isBooked?: boolean
}

export default function SessionCard({ session, serviceType, onBook, isBooked }: SessionCardProps) {
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
        </div>
      </div>

      <div className="flex items-center justify-between">
        {session.waitlistCount > 0 && (
          <span className="text-xs text-muted">{session.waitlistCount} on waitlist</span>
        )}
        <div className="ml-auto">
          {isBooked ? (
            <span className="text-sm text-sage font-medium">Booked</span>
          ) : (
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
