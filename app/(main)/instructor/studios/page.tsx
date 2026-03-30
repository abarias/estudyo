'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui'
import type { Studio } from '@/types/domain'

export default function InstructorStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/instructor/studios')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setStudios(data); setLoading(false) })
  }, [])

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">My Studios</h1>

      {studios.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <p className="font-medium text-text">No studios assigned</p>
          <p className="text-sm text-muted">Ask a studio owner to add you to their studio.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {studios.map(studio => (
            <Link key={studio.id} href={`/instructor/studios/${studio.id}`}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text">{studio.name}</p>
                  {studio.address && (
                    <p className="flex items-center gap-1 text-sm text-muted mt-0.5">
                      <MapPin size={12} />
                      {studio.address}
                    </p>
                  )}
                </div>
                <ChevronRight size={18} className="text-muted" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
