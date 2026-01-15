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
      
      {/* Sample map image */}
      <div className="h-32 bg-surface rounded-2xl border border-border overflow-hidden">
        <img 
          src="https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-73.99,40.73,12,0/400x200?access_token=pk.eyJ1IjoicGxhY2Vob2xkZXIiLCJhIjoiY2xhc3MifQ.demo"
          alt="Map"
          className="w-full h-full object-cover opacity-60"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-sky/20 to-sage/20 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>'
          }}
        />
      </div>

      <div className="space-y-3">
        {studios.map((studio) => (
          <StudioCard key={studio.id} studio={studio} />
        ))}
      </div>
    </div>
  )
}
