'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Clock, MapPin, Check } from 'lucide-react'
import { BottomSheet, Button, Card } from '@/components/ui'
import type { Session, ServiceType, Studio, Entitlement, Product } from '@/types/domain'

interface BookingBottomSheetProps {
  open: boolean
  onClose: () => void
  session: Session | null
  serviceType?: ServiceType
  studio?: Studio
  entitlements: Entitlement[]
  products: Product[]
  onBook: (entitlementId: string) => Promise<void>
  onJoinWaitlist: () => Promise<void>
  onPurchase: (productId: string) => Promise<void>
}

export default function BookingBottomSheet({
  open,
  onClose,
  session,
  serviceType,
  studio,
  entitlements,
  products,
  onBook,
  onJoinWaitlist,
  onPurchase,
}: BookingBottomSheetProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)

  if (!session) return null

  const spotsLeft = session.capacity - session.bookedCount
  const isFull = spotsLeft <= 0
  const hasEntitlement = entitlements.length > 0 && entitlements[0].remaining > 0

  const handleBook = async () => {
    if (!hasEntitlement) {
      setShowPurchase(true)
      return
    }
    setLoading(true)
    try {
      await onBook(entitlements[0].id)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  const handleWaitlist = async () => {
    setLoading(true)
    try {
      await onJoinWaitlist()
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (productId: string) => {
    setLoading(true)
    try {
      await onPurchase(productId)
      setShowPurchase(false)
    } finally {
      setLoading(false)
    }
  }

  const studioProducts = products.filter(p => p.studioId === session.studioId)

  return (
    <BottomSheet open={open} onClose={onClose} title={showPurchase ? 'Purchase Credits' : 'Book Session'}>
      {success ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center">
            <Check className="text-sage" size={32} />
          </div>
          <p className="text-lg font-semibold text-text">
            {isFull ? 'Added to Waitlist!' : 'Booking Confirmed!'}
          </p>
        </div>
      ) : showPurchase ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">Select a package to continue booking:</p>
          {studioProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:border-sage transition-colors"
              onClick={() => handlePurchase(product.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text">{product.name}</p>
                  <p className="text-sm text-muted">{product.description}</p>
                </div>
                <span className="font-semibold text-sage">${product.price}</span>
              </div>
            </Card>
          ))}
          <Button variant="ghost" fullWidth onClick={() => setShowPurchase(false)}>
            Back
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Session info */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: serviceType ? `var(--${serviceType.color})` : 'var(--muted)' }}
              />
              <h3 className="font-semibold text-text">{serviceType?.name}</h3>
            </div>
            <div className="space-y-1 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>{format(session.date, 'EEE, MMM d')} at {session.startTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{studio?.name}</span>
              </div>
            </div>
          </Card>

          {/* Entitlement status */}
          {hasEntitlement ? (
            <div className="bg-sage/10 rounded-2xl p-3 text-sm">
              <span className="text-sage font-medium">
                {entitlements[0].remaining} credits available
              </span>
              <span className="text-muted"> - 1 credit will be used</span>
            </div>
          ) : (
            <div className="bg-clay/10 rounded-2xl p-3 text-sm">
              <span className="text-clay font-medium">No credits available</span>
              <span className="text-muted"> - Purchase to continue</span>
            </div>
          )}

          {/* Action */}
          {isFull ? (
            <Button fullWidth onClick={handleWaitlist} disabled={loading}>
              {loading ? 'Joining...' : `Join Waitlist (${session.waitlistCount} waiting)`}
            </Button>
          ) : (
            <Button fullWidth onClick={handleBook} disabled={loading}>
              {loading ? 'Booking...' : hasEntitlement ? 'Confirm Booking' : 'Purchase to Book'}
            </Button>
          )}

          {!isFull && (
            <p className="text-xs text-muted text-center">
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
      )}
    </BottomSheet>
  )
}
