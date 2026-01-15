'use client'

import { useEffect, useState } from 'react'
import { getStudios } from '@/lib/api'
import { StudioCard } from '@/components/studio'
import type { Studio } from '@/types/domain'

export default function StudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudios().then((data) => {
      setStudios(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="p-4 text-muted">Loading studios...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">Studios</h1>
      
      {/* Map placeholder */}
      <div className="h-32 bg-surface rounded-2xl border border-border flex items-center justify-center text-muted text-sm">
        Map placeholder
      </div>

      <div className="space-y-3">
        {studios.map((studio) => (
          <StudioCard key={studio.id} studio={studio} />
        ))}
      </div>
    </div>
  )
}
