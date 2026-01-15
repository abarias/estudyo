'use client'

import { BottomSheet, Card } from '@/components/ui'
import type { Booking, Session } from '@/types/domain'
import { format } from 'date-fns'

interface AttendeeSheetProps {
  open: boolean
  onClose: () => void
  session: Session | null
  bookings: Booking[]
}

export default function AttendeeSheet({ open, onClose, session, bookings }: AttendeeSheetProps) {
  if (!session) return null

  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED')

  return (
    <BottomSheet open={open} onClose={onClose} title="Attendees">
      <div className="space-y-3">
        <div className="text-sm text-muted">
          {format(session.date, 'EEE, MMM d')} at {session.startTime}
        </div>
        
        <div className="text-sm">
          <span className="font-medium text-text">{confirmedBookings.length}</span>
          <span className="text-muted"> / {session.capacity} booked</span>
        </div>

        {confirmedBookings.length === 0 ? (
          <p className="text-muted text-sm py-4 text-center">No attendees yet</p>
        ) : (
          <div className="space-y-2">
            {confirmedBookings.map((booking, i) => (
              <Card key={booking.id} className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Attendee {i + 1}</span>
                  <span className="text-xs text-muted">
                    Booked {format(booking.bookedAt, 'MMM d, h:mm a')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
