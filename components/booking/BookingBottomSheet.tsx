'use client'

import { useState, useEffect } from 'react'
import { format, differenceInMinutes, differenceInHours } from 'date-fns'
import { Clock, MapPin, Check, AlertCircle, Loader2, Timer, Lock } from 'lucide-react'
import { BottomSheet, Button, Card } from '@/components/ui'
import type { Session, ServiceType, Studio, Entitlement, Product, WaitlistEntry, Booking } from '@/types/domain'

interface BookingBottomSheetProps {
  open: boolean
  onClose: () => void
  session: Session | null
  serviceType?: ServiceType
  studio?: Studio
  waitlistEnabled?: boolean
  requiresCredits?: boolean
  entitlements: Entitlement[]
  products: Product[]
  userBooking?: Booking | null
  userWaitlistEntry?: WaitlistEntry | null
  onBook: (entitlementId: string) => Promise<boolean | void>
  onCancel?: (bookingId: string) => Promise<boolean | void>
  onJoinWaitlist: () => Promise<boolean | string | void>
  onAcceptOffer?: (entryId: string, entitlementId: string) => Promise<boolean | void>
  onPurchase: (productId: string) => Promise<void>
}

export default function BookingBottomSheet({
  open,
  onClose,
  session,
  serviceType,
  studio,
  waitlistEnabled = true,
  requiresCredits = false,
  entitlements,
  products,
  userBooking,
  userWaitlistEntry,
  onBook,
  onCancel,
  onJoinWaitlist,
  onAcceptOffer,
  onPurchase,
}: BookingBottomSheetProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPurchase, setShowPurchase] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [offerTimeLeft, setOfferTimeLeft] = useState<number | null>(null)

  // Countdown for waitlist offer
  useEffect(() => {
    if (userWaitlistEntry?.status === 'OFFERED' && userWaitlistEntry.offerExpiresAt) {
      const updateCountdown = () => {
        const mins = differenceInMinutes(new Date(userWaitlistEntry.offerExpiresAt!), new Date())
        setOfferTimeLeft(Math.max(0, mins))
      }
      updateCountdown()
      const interval = setInterval(updateCountdown, 30000)
      return () => clearInterval(interval)
    } else {
      setOfferTimeLeft(null)
    }
  }, [userWaitlistEntry])

  if (!session) return null

  const spotsLeft = session.capacity - session.bookedCount
  const isFull = spotsLeft <= 0
  const hasEntitlement = entitlements.length > 0 && entitlements[0].remaining > 0
  const isBooked = userBooking?.status === 'CONFIRMED'
  const isOnWaitlist = userWaitlistEntry?.status === 'WAITING'
  const hasOffer = userWaitlistEntry?.status === 'OFFERED'

  // Check if within 24h cancel cutoff (use 1 hour for demo/testing)
  const sessionDateTime = new Date(session.date)
  const [h, m] = session.startTime.split(':').map(Number)
  sessionDateTime.setHours(h, m)
  const hoursUntilSession = differenceInHours(sessionDateTime, new Date())
  const canCancel = hoursUntilSession >= 1

  const resetState = () => {
    setStatus('idle')
    setErrorMessage('')
    setShowPurchase(false)
    setShowCancelConfirm(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleBook = async () => {
    if (requiresCredits && !hasEntitlement) {
      setShowPurchase(true)
      return
    }
    setLoading(true)
    setStatus('idle')
    try {
      const result = await onBook(requiresCredits ? entitlements[0]?.id : '')
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

  const handleCancel = async () => {
    if (!userBooking || !onCancel) return
    setLoading(true)
    setStatus('idle')
    try {
      const result = await onCancel(userBooking.id)
      if (result === false) {
        setStatus('error')
        setErrorMessage('Cancel failed. Please try again.')
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
      if (result === false || typeof result === 'string') {
        setStatus('error')
        setErrorMessage(typeof result === 'string' ? result : 'Failed to join waitlist.')
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

  const handleAcceptOffer = async () => {
    if (!userWaitlistEntry || !onAcceptOffer || !hasEntitlement) return
    setLoading(true)
    setStatus('idle')
    try {
      const result = await onAcceptOffer(userWaitlistEntry.id, entitlements[0].id)
      if (result === false) {
        setStatus('error')
        setErrorMessage('Failed to accept offer.')
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

  // Determine title based on state
  const getTitle = () => {
    if (showPurchase) return 'Purchase Credits'
    if (isBooked) return 'Your Booking'
    if (hasOffer) return 'Spot Available!'
    if (isOnWaitlist) return 'On Waitlist'
    return 'Book Session'
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title={getTitle()}>
      {status === 'success' ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center">
            <Check className="text-sage" size={32} />
          </div>
          <p className="text-lg font-semibold text-text">
            {isBooked ? "You're in!" : isFull ? 'Added to Waitlist!' : 'Booking Confirmed!'}
          </p>
          <p className="text-sm text-muted">See you there!</p>
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
                <span className="font-semibold text-sage">₱{product.price.toLocaleString()}</span>
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

          {/* Already booked state */}
          {isBooked && (
            <>
              <div className="bg-sage/10 rounded-2xl p-4 text-center">
                <Check className="text-sage mx-auto mb-2" size={24} />
                <p className="font-semibold text-sage">You&apos;re in!</p>
                <p className="text-sm text-muted mt-1">Your spot is confirmed</p>
              </div>

              {canCancel ? (
                showCancelConfirm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-center text-muted">
                      Are you sure you want to cancel this booking?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        Keep Booking
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={handleCancel}
                        disabled={loading}
                        className="bg-blush hover:bg-blush/90"
                      >
                        {loading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          'Yes, Cancel'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel Booking
                  </Button>
                )
              ) : (
                <div className="bg-clay/10 rounded-2xl p-3 flex items-center gap-2">
                  <Lock size={16} className="text-clay flex-shrink-0" />
                  <p className="text-sm text-clay">
                    Cancellation locked within 24 hours of class
                  </p>
                </div>
              )}
            </>
          )}

          {/* Waitlist offer state */}
          {hasOffer && !isBooked && (
            <>
              <div className="bg-clay/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="text-clay" size={18} />
                  <p className="font-semibold text-clay">A spot opened up!</p>
                </div>
                {offerTimeLeft !== null && (
                  <p className="text-sm text-clay">
                    Offer expires in {offerTimeLeft} minute{offerTimeLeft !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {(!requiresCredits || hasEntitlement) ? (
                <Button fullWidth onClick={handleAcceptOffer} disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Accepting...
                    </span>
                  ) : (
                    'Accept & Book Now'
                  )}
                </Button>
              ) : (
                <Button fullWidth onClick={() => setShowPurchase(true)}>
                  Purchase to Accept
                </Button>
              )}
            </>
          )}

          {/* On waitlist state */}
          {isOnWaitlist && !hasOffer && !isBooked && (
            <div className="bg-sky/10 rounded-2xl p-4 text-center">
              <p className="font-semibold text-sky">You&apos;re on the waitlist</p>
              <p className="text-sm text-muted mt-1">
                Position #{userWaitlistEntry?.position}. You&apos;ll get an offer when a spot opens.
              </p>
            </div>
          )}

          {/* Not booked - show booking options */}
          {!isBooked && !isOnWaitlist && !hasOffer && (
            <>
              {/* Credits status — only shown when payment is required */}
              {requiresCredits && (
                hasEntitlement ? (
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
                )
              )}

              {/* Action */}
              {isFull && !waitlistEnabled ? null : isFull ? (
                <>
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
                  <p className="text-xs text-muted text-center">
                    You&apos;ll get an offer when a spot opens. First come, first served.
                  </p>
                </>
              ) : (
                <>
                  <Button fullWidth onClick={handleBook} disabled={loading}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Booking...
                      </span>
                    ) : requiresCredits && !hasEntitlement ? (
                      'Purchase to Book'
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                  <p className="text-xs text-muted text-center">
                    {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining
                  </p>
                </>
              )}
            </>
          )}
        </div>
      )}
    </BottomSheet>
  )
}
