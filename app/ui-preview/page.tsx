'use client'

import { useState } from 'react'
import { Button, Card, Chip, Input, Divider, BottomSheet } from '@/components/ui'

export default function UIPreviewPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeChip, setActiveChip] = useState('all')

  return (
    <div className="min-h-screen bg-bg p-6 space-y-8">
      <h1 className="text-2xl font-bold text-text">UI Components Preview</h1>

      {/* Colors */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Color Tokens</h2>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-2">
            <div className="h-12 rounded-2xl bg-bg border border-border" />
            <p className="text-xs text-muted">bg</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 rounded-2xl bg-surface border border-border" />
            <p className="text-xs text-muted">surface</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 rounded-2xl bg-sage" />
            <p className="text-xs text-muted">sage</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 rounded-2xl bg-clay" />
            <p className="text-xs text-muted">clay</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 rounded-2xl bg-blush" />
            <p className="text-xs text-muted">blush</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 rounded-2xl bg-sky" />
            <p className="text-xs text-muted">sky</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 rounded-2xl bg-text" />
            <p className="text-xs text-muted">text</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 rounded-2xl bg-muted" />
            <p className="text-xs text-muted">muted</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      {/* Card */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Card</h2>
        <Card>
          <h3 className="font-semibold text-text">Card Title</h3>
          <p className="text-sm text-muted mt-1">This is a card with subtle shadow and rounded corners.</p>
        </Card>
      </section>

      {/* Chips */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Chips</h2>
        <div className="flex flex-wrap gap-2">
          {['all', 'pilates', 'yoga', 'dance'].map((chip) => (
            <Chip
              key={chip}
              active={activeChip === chip}
              onClick={() => setActiveChip(chip)}
            >
              {chip.charAt(0).toUpperCase() + chip.slice(1)}
            </Chip>
          ))}
        </div>
      </section>

      {/* Input */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Input</h2>
        <div className="max-w-sm space-y-3">
          <Input label="Email" placeholder="you@example.com" />
          <Input placeholder="Without label" />
        </div>
      </section>

      {/* Divider */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Divider</h2>
        <Divider />
        <Divider label="or continue with" />
      </section>

      {/* Bottom Sheet */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Bottom Sheet</h2>
        <Button onClick={() => setSheetOpen(true)}>Open Bottom Sheet</Button>
      </section>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Booking Details">
        <div className="space-y-4">
          <p className="text-muted">This is a mobile-first bottom sheet component.</p>
          <Card>
            <p className="text-sm">Session: Morning Pilates</p>
            <p className="text-sm text-muted">9:00 AM - 10:00 AM</p>
          </Card>
          <Button fullWidth>Confirm Booking</Button>
        </div>
      </BottomSheet>
    </div>
  )
}
