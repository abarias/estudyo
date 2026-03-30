import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import type { Studio } from '@/types/domain'
import { Card } from '@/components/ui'

interface StudioCardProps {
  studio: Studio
}

// Fitness/yoga/pilates icon as SVG
function StudioIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      {/* Person in yoga pose */}
      <circle cx="24" cy="10" r="5" fill="currentColor" opacity="0.8" />
      <path 
        d="M24 18c-4 0-7 3-7 7v2h14v-2c0-4-3-7-7-7z" 
        fill="currentColor" 
        opacity="0.6"
      />
      <path 
        d="M12 32l6-4 6 6 6-6 6 4" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path 
        d="M18 38l6-6 6 6" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  )
}

export default function StudioCard({ studio }: StudioCardProps) {
  const accentColor = studio.serviceTypes[0]?.color ?? 'sage'
  return (
    <Link href={`/studios/${studio.id}`}>
      <Card
        className="flex items-center gap-4 hover:shadow-md transition-shadow border-l-4"
        style={{ borderLeftColor: `var(--${accentColor})` }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage/30 to-clay/20 flex items-center justify-center flex-shrink-0 text-sage">
          <StudioIcon />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text truncate">{studio.name}</h3>
          {studio.description && (
            <p className="text-xs text-muted mt-0.5 line-clamp-2">{studio.description}</p>
          )}
          <div className="flex items-center gap-1 text-sm text-muted mt-0.5">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{studio.address}</span>
          </div>
          <div className="flex gap-1 mt-1.5">
            {studio.serviceTypes.slice(0, 3).map((st) => (
              <span
                key={st.id}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `var(--${st.color})20`, color: `var(--${st.color})` }}
              >
                {st.name}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight className="text-muted flex-shrink-0" size={20} />
      </Card>
    </Link>
  )
}
