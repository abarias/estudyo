'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { StudioCard } from '@/components/studio'

export default function StudiosPage() {
  const studios = useStore((s) => s.studios)
  const studiosLoading = useStore((s) => s.studiosLoading)
  const loadStudios = useStore((s) => s.loadStudios)

  useEffect(() => {
    loadStudios()
  }, [])

  if (studiosLoading && studios.length === 0) {
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
