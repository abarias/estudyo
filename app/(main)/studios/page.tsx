'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useStore } from '@/lib/store'
import { StudioCard } from '@/components/studio'

const StudioMap = dynamic(() => import('@/components/studio/StudioMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-sky/20 to-sage/20 flex items-center justify-center">
      <span className="text-xs text-muted">Loading map…</span>
    </div>
  ),
})

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

      {/* Interactive Google Map */}
      <div className="h-56 bg-surface rounded-2xl border border-border overflow-hidden">
        <StudioMap studios={studios} />
      </div>

      <div className="space-y-3">
        {studios.map((studio) => (
          <StudioCard key={studio.id} studio={studio} />
        ))}
      </div>
    </div>
  )
}
