'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { Clock, Users, MapPin } from 'lucide-react'
import { getSessionDetails, getEntitlements, getProducts, book, waitlistJoin, purchaseProduct } from '@/lib/api'
import { BookingBottomSheet } from '@/components/booking'
import { Card, Button } from '@/components/ui'

export default function SessionDetailPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  
  const [data, setData] = useState<Awaited<ReturnType<typeof getSessionDetails>> | null>(null)
  const [entitlements, setEntitlements] = useState<Awaited<ReturnType<typeof getEntitlements>>>([])
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSessionDetails(sessionId),
      getEntitlements('user-1'),
      getProducts(),
    ]).then(([result, ents, prods]) => {
      setData(result)
      setEntitlements(ents)
      setProducts(prods)
      setLoading(false)
    })
  }, [sessionId])

  if (loading) return <div className="p-4 text-muted">Loading...</div>
  if (!data) return <div className="p-4 text-muted">Session not found</div>

  const { session, studio, serviceType, room } = data
  const spotsLeft = session.capacity - session.bookedCount
  const isFull = spotsLeft <= 0

  const handleBook = async (entitlementId: string) => {
    const result = await book('user-1', session.id, entitlementId)
    if ('booking' in result) {
      setIsBooked(true)
    }
  }

  const handleJoinWaitlist = async () => {
    await waitlistJoin('user-1', session.id)
  }

  const handlePurchase = async (productId: string) => {
    await purchaseProduct('user-1', productId)
    const ents = await getEntitlements('user-1')
    setEntitlements(ents)
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: serviceType ? `var(--${serviceType.color})` : 'var(--muted)' }}
          />
          <h1 className="text-xl font-bold text-text">{serviceType?.name}</h1>
        </div>
        <p className="text-muted mt-1">{serviceType?.description}</p>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-muted" />
          <span className="text-text">
            {format(session.date, 'EEEE, MMM d')} at {session.startTime} - {session.endTime}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={16} className="text-muted" />
          <span className="text-text">{studio?.name} - {room?.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-muted" />
          <span className="text-text">
            {spotsLeft > 0 ? `${spotsLeft} of ${session.capacity} spots left` : 'Session full'}
          </span>
        </div>
      </Card>

      {isBooked ? (
        <div className="bg-sage/10 rounded-2xl p-4 text-center">
          <span className="text-sage font-medium">You&apos;re booked for this session!</span>
        </div>
      ) : isFull && !studio?.waitlistEnabled ? null : (
        <Button fullWidth onClick={() => setSheetOpen(true)}>
          {isFull ? 'Join Waitlist' : 'Book This Session'}
        </Button>
      )}

      <BookingBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        session={session}
        serviceType={serviceType}
        studio={studio || undefined}
        waitlistEnabled={studio?.waitlistEnabled ?? true}
        entitlements={entitlements}
        products={products}
        onBook={handleBook}
        onJoinWaitlist={handleJoinWaitlist}
        onPurchase={handlePurchase}
      />
    </div>
  )
}
