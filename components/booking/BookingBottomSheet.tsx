'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Clock, MapPin, Check, AlertCircle, Loader2 } from 'lucide-react'
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
  onBook: (entitlementId: string) => Promise<boolean | void>
  onJoinWaitlist: () => Promise<boolean | void>
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
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPurchase, setShowPurchase] = useState(false)

  if (!session) return null

  const spotsLeft = session.capacity - session.bookedCount
  const isFull = spotsLeft <= 0
  const hasEntitlement = entitlements.length > 0 && entitlements[0].remaining > 0

  const resetState = () => {
    setStatus('idle')
    setErrorMessage('')
    setShowPurchase(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleBook = async () => {
    if (!hasEntitlement) {
      setShowPurchase(true)
      return
    }
    setLoading(true)
    setStatus('idle')
    try {
      const result = await onBook(entitlements[0].id)
      if (result === false) {
        setStatus('error')
        setErrorMessage('Booking failed. Please try again.')
      } else {
        setStatus('success')
        setTimeout(handleClose, 1200)
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleWaitlist = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const result = await onJoinWaitlist()
      if (result === false) {
        setStatus('error')
        setErrorMessage('Failed to join waitlist.')
      } else {
        setStatus('success')
        setTimeout(handleClose, 1200)
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
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

  return (
    <BottomSheet open={open} onClose={handleClose} title={showPurchase ? 'Purchase Credits' : 'Book Session'}>
      {status === 'success' ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center">
            <Check className="text-sage" size={32} />
          </div>
          <p className="text-lg font-semibold text-text">
            {isFull ? 'Added to Waitlist!' : 'Booking Confirmed!'}
          </p>
        </div>
      ) : status === 'error' ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-blush/20 flex items-center justify-center">
            <AlertCircle className="text-blush" size={32} />
          </div>
          <p className="text-lg font-semibold text-text">Something went wrong</p>
          <p className="text-sm text-muted text-center">{errorMessage}</p>
          <Button variant="secondary" onClick={() => setStatus('idle')}>
            Try Again
          </Button>
        </div>
      ) : showPurchase ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">Select a package to continue booking:</p>
          {products.map((product) => (
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
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Joining...
                </span>
              ) : (
                `Join Waitlist (${session.waitlistCount} waiting)`
              )}
            </Button>
          ) : (
            <Button fullWidth onClick={handleBook} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Booking...
                </span>
              ) : hasEntitlement ? (
                'Confirm Booking'
              ) : (
                'Purchase to Book'
              )}
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
