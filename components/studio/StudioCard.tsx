import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import type { Studio } from '@/types/domain'
import { Card } from '@/components/ui'

interface StudioCardProps {
  studio: Studio
}

export default function StudioCard({ studio }: StudioCardProps) {
  return (
    <Link href={`/studios/${studio.id}`}>
      <Card className="flex items-center gap-3 hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="text-sage" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text truncate">{studio.name}</h3>
          <p className="text-sm text-muted truncate">{studio.address}</p>
          <div className="flex gap-1 mt-1">
            {studio.serviceTypes.slice(0, 3).map((st) => (
              <span
                key={st.id}
                className={`text-xs px-2 py-0.5 rounded-full bg-${st.color}/20 text-${st.color}`}
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
