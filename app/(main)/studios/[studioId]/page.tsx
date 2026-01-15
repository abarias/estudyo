'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getStudio, getSessions, getEntitlements, getProducts, book, waitlistJoin, purchaseProduct } from '@/lib/api'
import { DateStrip, SessionCard } from '@/components/studio'
import { BookingBottomSheet } from '@/components/booking'
import { Chip } from '@/components/ui'
import type { Studio, Session, ServiceType, Entitlement, Product } from '@/types/domain'

export default function StudioDetailPage() {
  const params = useParams()
  const studioId = params.studioId as string
  
  const [studio, setStudio] = useState<Studio | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bookedSessionIds, setBookedSessionIds] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [studioData, sessionsData, ents, prods] = await Promise.all([
      getStudio(studioId),
      getSessions({ studioId, date: selectedDate }),
      getEntitlements('user-1'),
      getProducts(studioId),
    ])
    setStudio(studioData)
    setSessions(sessionsData)
    setEntitlements(ents)
    setProducts(prods)
    setLoading(false)
  }, [studioId, selectedDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getServiceType = (id: string): ServiceType | undefined => {
    return studio?.serviceTypes.find(st => st.id === id)
  }

  const handleOpenSheet = (session: Session) => {
    setSelectedSession(session)
    setSheetOpen(true)
  }

  const handleBook = async (entitlementId: string) => {
    if (!selectedSession) return
    const result = await book('user-1', selectedSession.id, entitlementId)
    if ('booking' in result) {
      setBookedSessionIds(prev => new Set(prev).add(selectedSession.id))
      await loadData()
    }
  }

  const handleJoinWaitlist = async () => {
    if (!selectedSession) return
    await waitlistJoin('user-1', selectedSession.id)
    await loadData()
  }

  const handlePurchase = async (productId: string) => {
    await purchaseProduct('user-1', productId)
    const ents = await getEntitlements('user-1')
    setEntitlements(ents)
  }

  const filteredSessions = selectedService
    ? sessions.filter(s => s.serviceTypeId === selectedService)
    : sessions

  if (loading) {
    return <div className="p-4 text-muted">Loading...</div>
  }

  if (!studio) {
    return <div className="p-4 text-muted">Studio not found</div>
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
        {filteredSessions.length === 0 ? (
          <p className="text-muted text-sm py-4 text-center">No sessions available</p>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              serviceType={getServiceType(session.serviceTypeId)}
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
        serviceType={selectedSession ? getServiceType(selectedSession.serviceTypeId) : undefined}
        studio={studio}
        entitlements={entitlements}
        products={products}
        onBook={handleBook}
        onJoinWaitlist={handleJoinWaitlist}
        onPurchase={handlePurchase}
      />
    </div>
  )
}
