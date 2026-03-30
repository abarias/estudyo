'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Plus, X, Loader2, Check, Users, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import LocationPicker from '@/components/studio/LocationPicker'
import type { Studio, Room, ServiceType } from '@/types/domain'

const COLORS: Array<'sage' | 'clay' | 'blush' | 'sky'> = ['sage', 'clay', 'blush', 'sky']

type InstructorUser = { id: string; name: string | null; email: string | null }

export default function StudioEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Basic info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [coordLat, setCoordLat] = useState<number | null>(null)
  const [coordLng, setCoordLng] = useState<number | null>(null)
  const [timezone, setTimezone] = useState('UTC')
  const [waitlistEnabled, setWaitlistEnabled] = useState(true)
  const [allTimezones] = useState(() => Intl.supportedValuesOf('timeZone'))

  // Rooms
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomCapacity, setNewRoomCapacity] = useState('12')
  const [addingRoom, setAddingRoom] = useState(false)

  // Services
  const [services, setServices] = useState<ServiceType[]>([])
  const [newSvcName, setNewSvcName] = useState('')
  const [newSvcDuration, setNewSvcDuration] = useState('60')
  const [newSvcColor, setNewSvcColor] = useState<typeof COLORS[number]>('sage')
  const [addingSvc, setAddingSvc] = useState(false)

  // Instructors
  const [instructors, setInstructors] = useState<InstructorUser[]>([])
  const [allInstructors, setAllInstructors] = useState<InstructorUser[]>([])
  const [showInstructors, setShowInstructors] = useState(true)
  const [addingInstructor, setAddingInstructor] = useState(false)

  const fetchStudio = useCallback(async () => {
    const res = await fetch(`/api/owner/studios/${id}`)
    if (!res.ok) { router.push('/owner/studios'); return }
    const data: Studio = await res.json()
    setName(data.name)
    setDescription(data.description ?? '')
    setAddress(data.address ?? '')
    setCoordLat(data.coordinates?.lat ?? null)
    setCoordLng(data.coordinates?.lng ?? null)
    setTimezone((data as unknown as { timezone: string }).timezone ?? 'UTC')
    setWaitlistEnabled(data.waitlistEnabled ?? true)
    setRooms(data.rooms ?? [])
    setServices(data.serviceTypes ?? [])
  }, [id, router])

  useEffect(() => {
    Promise.all([
      fetchStudio(),
      fetch(`/api/owner/studios/${id}/instructors`).then(r => r.ok ? r.json() : []).then(setInstructors),
      fetch('/api/owner/instructors').then(r => r.ok ? r.json() : []).then(setAllInstructors),
    ]).finally(() => setLoading(false))
  }, [id, fetchStudio])

  const handleSaveBasic = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch(`/api/owner/studios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, address, coordLat, coordLng, timezone, waitlistEnabled }),
      })
      if (res.ok) setSaveSuccess(true)
    } finally {
      setSaving(false)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return
    setAddingRoom(true)
    try {
      const res = await fetch(`/api/owner/studios/${id}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName, capacity: newRoomCapacity }),
      })
      if (res.ok) {
        const room: Room = await res.json()
        setRooms(prev => [...prev, room])
        setNewRoomName('')
        setNewRoomCapacity('12')
      }
    } finally {
      setAddingRoom(false)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    await fetch(`/api/owner/studios/${id}/rooms/${roomId}`, { method: 'DELETE' })
    setRooms(prev => prev.filter(r => r.id !== roomId))
  }

  const handleAddService = async () => {
    if (!newSvcName.trim()) return
    setAddingSvc(true)
    try {
      const res = await fetch(`/api/owner/studios/${id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSvcName, durationMinutes: newSvcDuration, color: newSvcColor }),
      })
      if (res.ok) {
        const svc: ServiceType = await res.json()
        setServices(prev => [...prev, svc])
        setNewSvcName('')
        setNewSvcDuration('60')
      }
    } finally {
      setAddingSvc(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    await fetch(`/api/owner/studios/${id}/services/${serviceId}`, { method: 'DELETE' })
    setServices(prev => prev.filter(s => s.id !== serviceId))
  }

  const handleAddInstructor = async (instructorId: string) => {
    setAddingInstructor(true)
    try {
      const res = await fetch(`/api/owner/studios/${id}/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId }),
      })
      if (res.ok) {
        const added: InstructorUser = await res.json()
        setInstructors(prev => [...prev.filter(i => i.id !== added.id), added])
      }
    } finally {
      setAddingInstructor(false)
    }
  }

  const handleRemoveInstructor = async (instructorId: string) => {
    await fetch(`/api/owner/studios/${id}/instructors/${instructorId}`, { method: 'DELETE' })
    setInstructors(prev => prev.filter(i => i.id !== instructorId))
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    )
  }

  const untagged = allInstructors.filter(i => !instructors.some(t => t.id === i.id))

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/owner/studios')} className="p-2 -ml-2 text-muted">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text flex-1">Edit Studio</h1>
      </div>

      {/* Basic Info */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide">Basic Info</h2>
        <Card className="space-y-4">
          <Input
            label="Studio Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Serenity Studio"
          />

          <div>
            <label className="block text-sm font-medium text-text mb-1">Description <span className="text-muted font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your studio, its vibe, what to expect…"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-sage/30 transition-all duration-200 resize-none"
            />
          </div>

          <LocationPicker
            coordLat={coordLat}
            coordLng={coordLng}
            address={address}
            onLocationChange={(lat, lng, addr) => {
              setCoordLat(lat)
              setCoordLng(lng)
              setAddress(addr)
            }}
          />

          <div>
            <label className="block text-sm font-medium text-text mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text"
            >
              {allTimezones.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Waitlist toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-text">Waitlist</p>
              <p className="text-xs text-muted">Allow customers to join a waitlist when sessions are full</p>
            </div>
            <button
              onClick={() => setWaitlistEnabled(!waitlistEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${waitlistEnabled ? 'bg-sage' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${waitlistEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleSaveBasic}
            disabled={saving || !name.trim()}
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin mr-2" />Saving…</>
            ) : saveSuccess ? (
              <><Check size={16} className="mr-2" />Saved</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </Card>
      </section>

      {/* Rooms */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide">Rooms</h2>

        {rooms.map((room) => (
          <Card key={room.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text">{room.name}</p>
              <p className="text-xs text-muted">Capacity: {room.capacity}</p>
            </div>
            <button
              onClick={() => handleDeleteRoom(room.id)}
              className="p-2 text-muted hover:text-blush transition-colors"
            >
              <X size={16} />
            </button>
          </Card>
        ))}

        <Card>
          <p className="text-sm text-muted mb-3">Add a room</p>
          <div className="flex gap-2">
            <Input
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
            />
            <Input
              type="number"
              placeholder="Cap"
              value={newRoomCapacity}
              onChange={(e) => setNewRoomCapacity(e.target.value)}
              className="w-20"
            />
            <Button onClick={handleAddRoom} disabled={addingRoom || !newRoomName.trim()} className="px-3 flex-shrink-0">
              {addingRoom ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            </Button>
          </div>
        </Card>
      </section>

      {/* Services */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide">Services</h2>

        {services.map((svc) => (
          <Card key={svc.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: `var(--${svc.color})` }} />
              <div>
                <p className="font-medium text-text">{svc.name}</p>
                <p className="text-xs text-muted">{svc.durationMinutes} min</p>
              </div>
            </div>
            <button
              onClick={() => handleDeleteService(svc.id)}
              className="p-2 text-muted hover:text-blush transition-colors"
            >
              <X size={16} />
            </button>
          </Card>
        ))}

        <Card>
          <p className="text-sm text-muted mb-3">Add a service</p>
          <div className="space-y-3">
            <Input
              placeholder="Service name (e.g., Mat Pilates)"
              value={newSvcName}
              onChange={(e) => setNewSvcName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Duration (min)"
              value={newSvcDuration}
              onChange={(e) => setNewSvcDuration(e.target.value)}
            />
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewSvcColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${newSvcColor === c ? 'border-text scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: `var(--${c})` }}
                />
              ))}
            </div>
            <Button onClick={handleAddService} disabled={addingSvc || !newSvcName.trim()} fullWidth>
              {addingSvc ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
              Add Service
            </Button>
          </div>
        </Card>
      </section>

      {/* Instructors */}
      <section className="space-y-3">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowInstructors(!showInstructors)}
        >
          <h2 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
            <Users size={14} />
            Instructors
            {instructors.length > 0 && (
              <span className="text-sage font-normal">({instructors.length})</span>
            )}
          </h2>
          {showInstructors ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </button>

        {showInstructors && (
          <Card className="space-y-3">
            {instructors.length === 0 ? (
              <p className="text-sm text-muted">No instructors tagged yet</p>
            ) : (
              <div className="space-y-2">
                {instructors.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">{inst.name ?? inst.email}</p>
                      {inst.name && inst.email && <p className="text-xs text-muted">{inst.email}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveInstructor(inst.id)}
                      className="p-1.5 text-muted hover:text-blush transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {allInstructors.length === 0 ? (
              <p className="text-xs text-muted italic">No instructor accounts exist yet</p>
            ) : untagged.length > 0 ? (
              <div className="pt-1 border-t border-border">
                <select
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-surface text-text"
                  defaultValue=""
                  disabled={addingInstructor}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddInstructor(e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">Add instructor…</option>
                  {untagged.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name ?? inst.email}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-muted italic pt-1 border-t border-border">All available instructors are already assigned</p>
            )}
          </Card>
        )}
      </section>
    </div>
  )
}
