'use client'

import { useEffect, useState } from 'react'
import { Plus, MapPin, Layers, ChevronRight, Zap, Users, UserPlus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import Link from 'next/link'

type InstructorUser = { id: string; name: string | null; email: string | null }

export default function OwnerStudiosPage() {
  const [studios, setStudios] = useState<import('@/types/domain').Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  // Instructor management state per studio
  const [expandedInstructors, setExpandedInstructors] = useState<Record<string, boolean>>({})
  const [studioInstructors, setStudioInstructors] = useState<Record<string, InstructorUser[]>>({})
  const [allInstructors, setAllInstructors] = useState<InstructorUser[]>([])
  const [loadingInstructors, setLoadingInstructors] = useState<Record<string, boolean>>({})
  const [addingInstructor, setAddingInstructor] = useState<Record<string, boolean>>({})

  const fetchStudios = async () => {
    const res = await fetch('/api/owner/studios')
    if (!res.ok) return
    const data = await res.json() as Array<import('@/types/domain').Studio & { createdAt: string }>
    setStudios(data.map((s) => ({ ...s, createdAt: new Date(s.createdAt) })))
  }

  useEffect(() => {
    fetchStudios().finally(() => setLoading(false))
    // Pre-load all instructors for the add dropdown
    fetch('/api/owner/instructors')
      .then(r => r.ok ? r.json() : [])
      .then(setAllInstructors)
  }, [])

  const toggleWaitlist = async (studioId: string, current: boolean) => {
    setToggling(studioId)
    try {
      const res = await fetch(`/api/owner/studios/${studioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitlistEnabled: !current }),
      })
      if (res.ok) {
        setStudios((prev) =>
          prev.map((s) => s.id === studioId ? { ...s, waitlistEnabled: !current } : s)
        )
      }
    } finally {
      setToggling(null)
    }
  }

  const toggleInstructorPanel = async (studioId: string) => {
    const nowExpanded = !expandedInstructors[studioId]
    setExpandedInstructors(prev => ({ ...prev, [studioId]: nowExpanded }))
    if (nowExpanded && !studioInstructors[studioId]) {
      setLoadingInstructors(prev => ({ ...prev, [studioId]: true }))
      const res = await fetch(`/api/owner/studios/${studioId}/instructors`)
      const data = res.ok ? await res.json() : []
      setStudioInstructors(prev => ({ ...prev, [studioId]: data }))
      setLoadingInstructors(prev => ({ ...prev, [studioId]: false }))
    }
  }

  const addInstructor = async (studioId: string, instructorId: string) => {
    setAddingInstructor(prev => ({ ...prev, [studioId]: true }))
    const res = await fetch(`/api/owner/studios/${studioId}/instructors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructorId }),
    })
    if (res.ok) {
      const added: InstructorUser = await res.json()
      setStudioInstructors(prev => ({
        ...prev,
        [studioId]: [...(prev[studioId] ?? []).filter(i => i.id !== added.id), added],
      }))
    }
    setAddingInstructor(prev => ({ ...prev, [studioId]: false }))
  }

  const removeInstructor = async (studioId: string, instructorId: string) => {
    await fetch(`/api/owner/studios/${studioId}/instructors/${instructorId}`, { method: 'DELETE' })
    setStudioInstructors(prev => ({
      ...prev,
      [studioId]: (prev[studioId] ?? []).filter(i => i.id !== instructorId),
    }))
  }

  if (loading) return <div className="p-4 text-muted">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Studios</h1>
        <div className="flex gap-2">
          <Link href="/owner/generate">
            <Button variant="ghost" className="flex items-center gap-1.5 text-sm px-3 py-2">
              <Zap size={16} />
              Generate
            </Button>
          </Link>
          <Link href="/owner/setup">
            <Button variant="primary" className="flex items-center gap-1.5 text-sm px-3 py-2">
              <Plus size={16} />
              New Studio
            </Button>
          </Link>
        </div>
      </div>

      {studios.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-14 h-14 bg-sage/10 rounded-full flex items-center justify-center mx-auto">
            <MapPin size={24} className="text-sage" />
          </div>
          <p className="font-medium text-text">No studios yet</p>
          <p className="text-sm text-muted">Set up your first studio to get started</p>
          <Link href="/owner/setup">
            <Button variant="primary" className="mt-2">
              Set Up Studio
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {studios.map((studio) => {
            const instructors = studioInstructors[studio.id] ?? []
            const isExpanded = expandedInstructors[studio.id] ?? false
            const isLoadingInst = loadingInstructors[studio.id] ?? false
            const isAdding = addingInstructor[studio.id] ?? false
            const untagged = allInstructors.filter(i => !instructors.some(t => t.id === i.id))

            return (
              <Card key={studio.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text">{studio.name}</p>
                    {studio.address && (
                      <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />
                        {studio.address}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-muted flex-shrink-0" />
                </div>

                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Layers size={12} />
                    {studio.rooms?.length ?? 0} room{(studio.rooms?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {studio.serviceTypes?.length ?? 0} service{(studio.serviceTypes?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                {studio.serviceTypes && studio.serviceTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {studio.serviceTypes.map((st) => (
                      <span
                        key={st.id}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `color-mix(in srgb, var(--${st.color}) 15%, transparent)`,
                          color: `var(--${st.color})`,
                        }}
                      >
                        {st.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Waitlist toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Users size={13} />
                    <span>Waitlist</span>
                  </div>
                  <button
                    onClick={() => toggleWaitlist(studio.id, studio.waitlistEnabled ?? true)}
                    disabled={toggling === studio.id}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      (studio.waitlistEnabled ?? true) ? 'bg-sage' : 'bg-border'
                    } ${toggling === studio.id ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        (studio.waitlistEnabled ?? true) ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Instructor management */}
                <button
                  className="flex items-center justify-between w-full pt-1 border-t border-border text-xs text-muted"
                  onClick={() => toggleInstructorPanel(studio.id)}
                >
                  <span className="flex items-center gap-1.5">
                    <UserPlus size={13} />
                    Instructors
                    {isExpanded && instructors.length > 0 && (
                      <span className="text-sage">({instructors.length})</span>
                    )}
                  </span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isExpanded && (
                  <div className="space-y-2">
                    {isLoadingInst ? (
                      <p className="text-xs text-muted">Loading...</p>
                    ) : (
                      <>
                        {instructors.length === 0 ? (
                          <p className="text-xs text-muted">No instructors tagged</p>
                        ) : (
                          <div className="space-y-1.5">
                            {instructors.map(inst => (
                              <div key={inst.id} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-text">{inst.name ?? inst.email}</p>
                                  {inst.name && inst.email && (
                                    <p className="text-xs text-muted">{inst.email}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeInstructor(studio.id, inst.id)}
                                  className="p-1 text-muted hover:text-blush transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {untagged.length > 0 && (
                          <div className="pt-1">
                            <select
                              className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-text"
                              defaultValue=""
                              disabled={isAdding}
                              onChange={(e) => {
                                if (e.target.value) {
                                  addInstructor(studio.id, e.target.value)
                                  e.target.value = ''
                                }
                              }}
                            >
                              <option value="">+ Add instructor…</option>
                              {untagged.map(inst => (
                                <option key={inst.id} value={inst.id}>
                                  {inst.name ?? inst.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {allInstructors.length === 0 && (
                          <p className="text-xs text-muted italic">No instructor accounts exist yet</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
