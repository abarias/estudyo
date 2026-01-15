'use client'

import { useRouter } from 'next/navigation'
import { Card, Button } from '@/components/ui'
import { ArrowRight, Calendar, Clock, Users, ShoppingBag, X, CheckCircle } from 'lucide-react'

const FLOWS = [
  {
    title: 'Browse Studios',
    description: 'Discover available classes and schedules',
    href: '/studios',
    icon: Calendar,
    time: '10s',
  },
  {
    title: 'Book a Class',
    description: 'Select a session and confirm with credits',
    href: '/studios/studio-1',
    icon: CheckCircle,
    time: '15s',
  },
  {
    title: 'Join Waitlist',
    description: 'Get notified when a full class has an opening',
    href: '/dev',
    note: 'Load Scenario 3, then book full class',
    icon: Users,
    time: '20s',
  },
  {
    title: 'Owner: Simulate Slot',
    description: 'Open a spot and trigger waitlist offer',
    href: '/owner',
    icon: Clock,
    time: '15s',
  },
  {
    title: 'Accept Waitlist Offer',
    description: '15-minute window to claim your spot',
    href: '/dev',
    note: 'Load Scenario 4, then go to Bookings',
    icon: ShoppingBag,
    time: '10s',
  },
  {
    title: 'Cancel Booking',
    description: 'Cancel eligible bookings (24h+ before class)',
    href: '/bookings',
    note: 'Book a future class first',
    icon: X,
    time: '10s',
  },
]

export default function DemoPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-text">Estudyo Demo</h1>
          <p className="text-muted mt-2">Test the MVP in 60 seconds</p>
        </div>

        {/* Quick Start */}
        <Card className="bg-sage/10 border-sage">
          <h2 className="font-semibold text-text mb-2">Quick Start</h2>
          <ol className="text-sm text-muted space-y-1 list-decimal list-inside">
            <li>Go to <strong>/dev</strong> to load demo scenarios</li>
            <li>Select <strong>Scenario 1</strong> (Credits Available)</li>
            <li>Browse and book classes!</li>
          </ol>
          <Button
            onClick={() => router.push('/dev')}
            className="mt-4"
            fullWidth
          >
            Open Dev Console <ArrowRight size={16} className="ml-2" />
          </Button>
        </Card>

        {/* Flows */}
        <h2 className="font-semibold text-text pt-2">Key Flows to Test</h2>
        
        {FLOWS.map((flow, i) => (
          <Card
            key={i}
            className="cursor-pointer hover:border-sage transition-colors"
            onClick={() => router.push(flow.href)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                <flow.icon size={20} className="text-sage" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-text">{flow.title}</h3>
                  <span className="text-xs text-muted bg-border px-2 py-1 rounded-full">
                    ~{flow.time}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">{flow.description}</p>
                {flow.note && (
                  <p className="text-xs text-sage mt-2 bg-sage/10 px-2 py-1 rounded">
                    💡 {flow.note}
                  </p>
                )}
              </div>
              <ArrowRight size={16} className="text-muted flex-shrink-0 mt-3" />
            </div>
          </Card>
        ))}

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted">
          <p>All data is mock/in-memory. No backend required.</p>
          <p className="mt-1">
            <a href="/dev" className="text-sage underline">Dev Console</a>
            {' • '}
            <a href="/studios" className="text-sage underline">Studios</a>
            {' • '}
            <a href="/owner" className="text-sage underline">Owner</a>
          </p>
        </div>
      </div>
    </div>
  )
}
