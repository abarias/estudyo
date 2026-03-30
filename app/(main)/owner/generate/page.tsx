'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addMonths, startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, Button } from '@/components/ui'
import type { Studio } from '@/types/domain'

type RangeOption = '14' | '30' | '60' | 'month'

type OwnerStudio = Studio & { templateCount: number }

const RANGE_OPTIONS: { id: RangeOption; label: string }[] = [
  { id: '14', label: '14 days' },
  { id: '30', label: '30 days' },
  { id: '60', label: '60 days' },
  { id: 'month', label: 'Month' },
]

export default function GenerateSessionsPage() {
  const router = useRouter()
  const generateSessionsForStudio = useStore((s) => s.generateSessionsForStudio)

  const [ownerStudios, setOwnerStudios] = useState<OwnerStudio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/owner/studios')
      .then((r) => r.json())
      .then((data: OwnerStudio[]) => {
        setOwnerStudios(data.filter((s) => s.templateCount > 0))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const studiosWithTemplates = ownerStudios

  const [selectedStudioId, setSelectedStudioId] = useState('')

  useEffect(() => {
    if (studiosWithTemplates.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studiosWithTemplates[0].id)
    }
  }, [studiosWithTemplates])
  const [range, setRange] = useState<RangeOption>('30')
  const [monthOffset, setMonthOffset] = useState(0) // 0 = current month, 1 = next month, etc.
  const [done, setDone] = useState(false)
  const [generated, setGenerated] = useState(0)
  const [generating, setGenerating] = useState(false)

  const studio = ownerStudios.find((s) => s.id === selectedStudioId)

  // Compute start date and days
  const { startDate, days, label } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (range === 'month') {
      const target = addMonths(startOfMonth(today), monthOffset)
      const end = endOfMonth(target)
      return {
        startDate: target,
        days: differenceInDays(end, target) + 1,
        label: format(target, 'MMMM yyyy'),
      }
    }

    const numDays = parseInt(range)
    return {
      startDate: today,
      days: numDays,
      label: `Next ${numDays} days`,
    }
  }, [range, monthOffset])

  const templateCount = studio?.templateCount ?? 0

  // Estimate session count: average 3 days/week per template × templateCount
  const estimated = useMemo(() => {
    if (!templateCount) return 0
    // Use days/7 weeks × templateCount × avg 3 days/week as rough estimate
    // Actual count comes back from the API after generation
    return Math.round((days / 7) * templateCount * 3)
  }, [templateCount, days])

  const handleGenerate = async () => {
    setGenerating(true)
    const count = await generateSessionsForStudio(selectedStudioId, startDate, days)
    setGenerated(count)
    setDone(true)
    setGenerating(false)
  }

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  if (!studiosWithTemplates.length) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1 text-muted">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-text">Generate Sessions</h1>
        </div>
        <Card className="text-center py-8 space-y-3">
          <CalendarDays size={32} className="text-muted mx-auto" />
          <p className="font-medium text-text">No templates found</p>
          <p className="text-sm text-muted">
            Complete the studio setup wizard first to define your recurring schedule templates.
          </p>
          <Button variant="primary" onClick={() => router.push('/owner/setup')}>
            Go to Setup
          </Button>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-text">Generate Sessions</h1>
        <Card className="text-center py-10 space-y-3">
          <div className="w-14 h-14 bg-sage/10 rounded-full flex items-center justify-center mx-auto">
            <Check size={28} className="text-sage" />
          </div>
          <p className="font-semibold text-text">
            {generated} session{generated !== 1 ? 's' : ''} generated
          </p>
          <p className="text-sm text-muted">
            {studio?.name} • {label}
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setDone(false); setGenerated(0) }}>
              Generate More
            </Button>
            <Button variant="primary" fullWidth onClick={() => router.push('/owner')}>
              View Schedule
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1 text-muted">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text">Generate Sessions</h1>
      </div>

      {/* Studio picker */}
      {studiosWithTemplates.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-text mb-2">Studio</label>
          <div className="space-y-2">
            {studiosWithTemplates.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudioId(s.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  selectedStudioId === s.id
                    ? 'border-sage bg-sage/5'
                    : 'border-border bg-surface'
                }`}
              >
                <p className="font-medium text-text text-sm">{s.name}</p>
                <p className="text-xs text-muted">{(s as OwnerStudio).templateCount} template(s)</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Studio summary */}
      {studio && (
        <Card className="space-y-1">
          <p className="text-sm font-medium text-text">{studio.name}</p>
          <p className="text-xs text-muted">{templateCount} recurring template{templateCount !== 1 ? 's' : ''}</p>
        </Card>
      )}

      {/* Date range */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">Date Range</label>
        <div className="grid grid-cols-4 gap-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRange(opt.id)}
              className={`py-2.5 text-xs font-medium rounded-xl transition-colors ${
                range === opt.id ? 'bg-sage text-white' : 'bg-surface border border-border text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Month picker */}
      {range === 'month' && (
        <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
          <button
            onClick={() => setMonthOffset((n) => Math.max(0, n - 1))}
            disabled={monthOffset === 0}
            className="p-1 text-muted disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="font-medium text-text text-sm">{label}</p>
          <button
            onClick={() => setMonthOffset((n) => Math.min(11, n + 1))}
            disabled={monthOffset === 11}
            className="p-1 text-muted disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Preview */}
      <Card className="bg-sage/5 border-sage/20">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-sage flex-shrink-0" />
          <div>
            <p className="font-semibold text-text">
              ~{estimated} session{estimated !== 1 ? 's' : ''} will be created
            </p>
            <p className="text-xs text-muted mt-0.5">{label}</p>
          </div>
        </div>
      </Card>

      <Button
        variant="primary"
        fullWidth
        disabled={!selectedStudioId || estimated === 0 || generating}
        onClick={handleGenerate}
      >
        {generating ? 'Generating…' : 'Generate Sessions'}
      </Button>
    </div>
  )
}
