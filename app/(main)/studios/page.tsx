'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Search, X, Map, List } from 'lucide-react'
import { useStore } from '@/lib/store'
import { StudioCard } from '@/components/studio'
import { Chip } from '@/components/ui'

const StudioMap = dynamic(() => import('@/components/studio/StudioMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-sky/20 to-sage/20 flex items-center justify-center">
      <span className="text-xs text-muted">Loading map…</span>
    </div>
  ),
})

type View = 'list' | 'map'

export default function StudiosPage() {
  const studios = useStore((s) => s.studios)
  const studiosLoading = useStore((s) => s.studiosLoading)
  const loadStudios = useStore((s) => s.loadStudios)

  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')
  const [activeService, setActiveService] = useState<string | null>(null)

  useEffect(() => {
    loadStudios()
  }, [])

  // Unique service type names across all studios, in order of first appearance
  const serviceTypeNames = useMemo(() => {
    const seen = new Set<string>()
    for (const studio of studios) {
      for (const st of studio.serviceTypes) {
        seen.add(st.name)
      }
    }
    return Array.from(seen)
  }, [studios])

  const filtered = useMemo(() => {
    let result = studios
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description ?? '').toLowerCase().includes(q) ||
          s.serviceTypes.some((st) => st.name.toLowerCase().includes(q))
      )
    }
    if (activeService) {
      result = result.filter((s) =>
        s.serviceTypes.some((st) => st.name === activeService)
      )
    }
    return result
  }, [studios, search, activeService])

  if (studiosLoading && studios.length === 0) {
    return <div className="p-4 text-muted">Loading studios...</div>
  }

  return (
    <div className={view === 'map' ? 'flex flex-col' : 'p-4 space-y-4'}>

      {/* View toggle — always visible */}
      <div className={view === 'map' ? 'px-4 pt-4 pb-2 flex-shrink-0' : ''}>
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setView('list')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === 'list' ? 'bg-sage text-white' : 'text-muted hover:text-text'
            }`}
          >
            <List size={15} />
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === 'map' ? 'bg-sage text-white' : 'text-muted hover:text-text'
            }`}
          >
            <Map size={15} />
            Map
          </button>
        </div>
      </div>

      {view === 'map' ? (
        /* Map view — full height below the toggle */
        <div className="h-[calc(100svh-130px)]">
          <StudioMap studios={studios} />
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search studios or services…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-sage/30 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Service type filter chips */}
          {serviceTypeNames.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              <Chip
                active={activeService === null}
                onClick={() => setActiveService(null)}
              >
                All
              </Chip>
              {serviceTypeNames.map((name) => (
                <Chip
                  key={name}
                  active={activeService === name}
                  onClick={() => setActiveService(activeService === name ? null : name)}
                >
                  {name}
                </Chip>
              ))}
            </div>
          )}

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-text font-medium">No studios found</p>
              <p className="text-sm text-muted">
                {search || activeService
                  ? 'Try a different search or filter'
                  : 'No studios are available yet'}
              </p>
              {(search || activeService) && (
                <button
                  onClick={() => { setSearch(''); setActiveService(null) }}
                  className="text-sm text-sage underline underline-offset-2 mt-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((studio) => (
                <StudioCard key={studio.id} studio={studio} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
