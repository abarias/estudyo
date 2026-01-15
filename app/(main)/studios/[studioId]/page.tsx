'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { DateStrip, SessionCard } from '@/components/studio'
import { BookingBottomSheet } from '@/components/booking'
import { Chip } from '@/components/ui'
import type { Session } from '@/types/domain'

export default function StudioDetailPage() {
  const params = useParams()
  const studioId = params.studioId as string
  
  const studios = useStore((s) => s.studios)
  const loadStudios = useStore((s) => s.loadStudios)
  const getServiceType = useStore((s) => s.getServiceType)
  const sessions = useStore((s) => s.sessions)
  const loadSessions = useStore((s) => s.loadSessions)
  const entitlements = useStore((s) => s.entitlements)
  const loadWallet = useStore((s) => s.loadWallet)
  const products = useStore((s) => s.products)
  const loadProducts = useStore((s) => s.loadProducts)
  const bookings = useStore((s) => s.bookings)
  const loadBookings = useStore((s) => s.loadBookings)
  const waitlistEntries = useStore((s) => s.waitlistEntries)
  const loadWaitlist = useStore((s) => s.loadWaitlist)
  const bookSession = useStore((s) => s.bookSession)
  const cancelBooking = useStore((s) => s.cancelBooking)
  const joinWaitlist = useStore((s) => s.joinWaitlist)
  const acceptWaitlistOffer = useStore((s) => s.acceptWaitlistOffer)
  const purchaseProduct = useStore((s) => s.purchaseProduct)

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const studio = studios.find(s => s.id === studioId)

  // Initial load
  useEffect(() => {
    const load = async () => {
      await Promise.all([
        loadStudios(),
        loadWallet(),
        loadProducts(studioId),
        loadBookings(),
        loadWaitlist(),
      ])
    }
    load()
  }, [studioId])

  // Load sessions when date changes
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await loadSessions({ studioId, date: selectedDate })
      setLoading(false)
    }
    load()
  }, [studioId, selectedDate])

  const bookedSessionIds = new Set(
    bookings.filter(b => b.status === 'CONFIRMED').map(b => b.sessionId)
  )

  const handleOpenSheet = (session: Session) => {
    setSelectedSession(session)
    setSheetOpen(true)
  }

  const handleBook = async (entitlementId: string) => {
    if (!selectedSession) return
    return await bookSession(selectedSession.id, entitlementId)
  }

  const handleJoinWaitlist = async () => {
    if (!selectedSession) return
    return await joinWaitlist(selectedSession.id)
  }

  const handleCancel = async (bookingId: string) => {
    return await cancelBooking(bookingId)
  }

  const handleAcceptOffer = async (entryId: string, entitlementId: string) => {
    return await acceptWaitlistOffer(entryId, entitlementId)
  }

  const handlePurchase = async (productId: string) => {
    await purchaseProduct(productId)
  }

  // Get user's booking and waitlist entry for selected session
  const userBooking = selectedSession 
    ? bookings.find(b => b.sessionId === selectedSession.id && b.status === 'CONFIRMED')
    : undefined

  const userWaitlistEntry = selectedSession
    ? waitlistEntries.find(w => w.sessionId === selectedSession.id && (w.status === 'WAITING' || w.status === 'OFFERED'))
    : undefined

  const filteredSessions = selectedService
    ? sessions.filter(s => s.serviceTypeId === selectedService)
    : sessions

  if (!studio) {
    return <div className="p-4 text-muted">Loading...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-text">{studio.name}</h1>
        <p className="text-sm text-muted">{studio.address}</p>
      </div>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Service type filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <Chip
          active={selectedService === null}
          onClick={() => setSelectedService(null)}
        >
          All
        </Chip>
        {studio.serviceTypes.map((st) => (
          <Chip
            key={st.id}
            active={selectedService === st.id}
            onClick={() => setSelectedService(st.id)}
          >
            {st.name}
          </Chip>
        ))}
      </div>

      {/* Sessions */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted text-sm py-4 text-center">Loading sessions...</p>
        ) : filteredSessions.length === 0 ? (
          <p className="text-muted text-sm py-4 text-center">No sessions available</p>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              serviceType={getServiceType(session.studioId, session.serviceTypeId)}
              isBooked={bookedSessionIds.has(session.id)}
              onBook={() => handleOpenSheet(session)}
            />
          ))
        )}
      </div>

      <BookingBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        session={selectedSession}
        serviceType={selectedSession ? getServiceType(selectedSession.studioId, selectedSession.serviceTypeId) : undefined}
        studio={studio}
        entitlements={entitlements}
        products={products.filter(p => p.studioId === studioId)}
        userBooking={userBooking}
        userWaitlistEntry={userWaitlistEntry}
        onBook={handleBook}
        onCancel={handleCancel}
        onJoinWaitlist={handleJoinWaitlist}
        onAcceptOffer={handleAcceptOffer}
        onPurchase={handlePurchase}
      />
    </div>
  )
}
