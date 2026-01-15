'use client'

import { useState } from 'react'
import { Card, Button, Input } from '@/components/ui'

interface OwnerSetupPanelProps {
  onCreateService: (name: string, duration: number) => void
  onRegenerateSessions: () => void
}

export default function OwnerSetupPanel({ onCreateService, onRegenerateSessions }: OwnerSetupPanelProps) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('55')
  const [expanded, setExpanded] = useState(false)

  const handleCreate = () => {
    if (name.trim()) {
      onCreateService(name.trim(), parseInt(duration) || 55)
      setName('')
    }
  }

  return (
    <Card>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left font-semibold text-text"
      >
        {expanded ? '− Studio Setup' : '+ Studio Setup'}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted">Add a new service type:</p>
            <Input
              placeholder="Service name (e.g. HIIT)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <Button variant="secondary" onClick={handleCreate} fullWidth>
              Add Service
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted mb-3">Regenerate sessions (mock):</p>
            <Button variant="ghost" onClick={onRegenerateSessions} fullWidth>
              Regenerate All Sessions
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
