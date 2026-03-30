'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button, Card, Input } from '@/components/ui'
import LocationPicker from '@/components/studio/LocationPicker'

const STEPS = ['Studio', 'Rooms', 'Services', 'Products', 'Templates', 'Instructors', 'Generate']
const COLORS: Array<'sage' | 'clay' | 'blush' | 'sky'> = ['sage', 'clay', 'blush', 'sky']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function OwnerSetupPage() {
  const router = useRouter()
  const setup = useStore((s) => s.setup)
  const setSetupStep = useStore((s) => s.setSetupStep)
  const updateSetupStudio = useStore((s) => s.updateSetupStudio)
  const addSetupRoom = useStore((s) => s.addSetupRoom)
  const removeSetupRoom = useStore((s) => s.removeSetupRoom)
  const addSetupServiceType = useStore((s) => s.addSetupServiceType)
  const removeSetupServiceType = useStore((s) => s.removeSetupServiceType)
  const addSetupProduct = useStore((s) => s.addSetupProduct)
  const removeSetupProduct = useStore((s) => s.removeSetupProduct)
  const addSetupTemplate = useStore((s) => s.addSetupTemplate)
  const removeSetupTemplate = useStore((s) => s.removeSetupTemplate)
  const setSetupInstructors = useStore((s) => s.setSetupInstructors)
  const setGenerateDays = useStore((s) => s.setGenerateDays)
  const completeSetup = useStore((s) => s.completeSetup)

  // Local form state
  const [roomName, setRoomName] = useState('')
  const [roomCapacity, setRoomCapacity] = useState('12')
  const [stName, setStName] = useState('')
  const [stDuration, setStDuration] = useState('60')
  const [stCapacity, setStCapacity] = useState('12')
  const [stColor, setStColor] = useState<typeof COLORS[number]>('sage')
  const [prodType, setProdType] = useState<'SINGLE_SESSION' | 'CREDIT_PACK' | 'PACKAGE'>('SINGLE_SESSION')
  const [prodName, setProdName] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodCredits, setProdCredits] = useState('5')
  const [prodSessions, setProdSessions] = useState('10')
  const [prodExpiry, setProdExpiry] = useState('30')
  const [tplService, setTplService] = useState('')
  const [tplDays, setTplDays] = useState<number[]>([1, 3, 5])
  const [tplTime, setTplTime] = useState('09:00')
  const [tplCapacity, setTplCapacity] = useState('')
  const [allInstructors, setAllInstructors] = useState<{ id: string; name: string | null; email: string | null }[]>([])
  const [done, setDone] = useState(false)
  const [completedName, setCompletedName] = useState('')
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState('')

  const allTimezones = useMemo(() => Intl.supportedValuesOf('timeZone'), [])

  const step = setup.step

  // Fetch instructors when reaching step 5
  useEffect(() => {
    if (step === 5 && allInstructors.length === 0) {
      fetch('/api/owner/instructors')
        .then(r => r.ok ? r.json() : [])
        .then(setAllInstructors)
    }
  }, [step, allInstructors.length])

  const canNext = () => {
    if (step === 0) return setup.studioName.trim() && setup.studioAddress.trim()
    if (step === 1) return setup.rooms.length > 0
    if (step === 2) return setup.serviceTypes.length > 0
    if (step === 3) return setup.products.length > 0
    if (step === 4) return setup.templates.length > 0
    // step 5 (Instructors) and step 6 (Generate) are always valid
    return true
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setSetupStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setSetupStep(step - 1)
  }

  const handleComplete = async () => {
    setCompleting(true)
    setCompleteError('')
    setCompletedName(setup.studioName)
    try {
      await completeSetup()
      setDone(true)
    } catch {
      setCompleteError('Something went wrong. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  const handleAddRoom = () => {
    if (!roomName.trim()) return
    addSetupRoom({
      id: `room-temp-${Date.now()}`,
      name: roomName,
      capacity: parseInt(roomCapacity) || 12,
    })
    setRoomName('')
    setRoomCapacity('12')
  }

  const handleAddServiceType = () => {
    if (!stName.trim()) return
    addSetupServiceType({
      id: `st-temp-${Date.now()}`,
      name: stName,
      durationMinutes: parseInt(stDuration) || 60,
      defaultCapacity: parseInt(stCapacity) || 12,
      color: stColor,
    })
    setStName('')
    setStDuration('60')
    setStCapacity('12')
  }

  const handleAddProduct = () => {
    if (!prodName.trim() || !prodPrice.trim()) return
    addSetupProduct({
      id: `prod-temp-${Date.now()}`,
      type: prodType,
      name: prodName,
      price: parseFloat(prodPrice) || 0,
      credits: prodType === 'CREDIT_PACK' ? parseInt(prodCredits) : undefined,
      sessions: prodType === 'PACKAGE' ? parseInt(prodSessions) : undefined,
      expiryDays: parseInt(prodExpiry) || 30,
    })
    setProdName('')
    setProdPrice('')
  }

  const handleAddTemplate = () => {
    if (!tplService || tplDays.length === 0) return
    addSetupTemplate({
      id: `tpl-temp-${Date.now()}`,
      serviceTypeId: tplService,
      daysOfWeek: tplDays,
      startTime: tplTime,
      capacityOverride: tplCapacity ? parseInt(tplCapacity) : undefined,
    })
    setTplDays([1, 3, 5])
    setTplTime('09:00')
    setTplCapacity('')
  }

  const toggleDay = (day: number) => {
    setTplDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  if (done) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto">
            <Check size={32} className="text-sage" />
          </div>
          <h2 className="text-xl font-bold text-text">Studio Created!</h2>
          <p className="text-sm text-muted">
            <strong>{completedName || 'Your studio'}</strong> has been set up with sessions ready to go.
          </p>
          <Button variant="primary" fullWidth onClick={() => router.push('/owner/studios')}>
            View My Studios
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg p-4">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-text">Studio Setup</h1>
          <span className="text-sm text-muted">{step + 1}/{STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-sage' : 'bg-border'}`}
            />
          ))}
        </div>
        <p className="text-sm text-muted mt-2">{STEPS[step]}</p>
      </div>

      {/* Step content */}
      <div className="space-y-4">
        {step === 0 && (
          <>
            <Input
              label="Studio Name"
              value={setup.studioName}
              onChange={(e) => updateSetupStudio({ studioName: e.target.value })}
              placeholder="e.g., Serenity Studio"
            />
            <LocationPicker
              coordLat={setup.coordLat}
              coordLng={setup.coordLng}
              address={setup.studioAddress}
              onLocationChange={(lat, lng, addr) =>
                updateSetupStudio({ coordLat: lat, coordLng: lng, studioAddress: addr })
              }
            />
            <div>
              <label className="block text-sm font-medium text-text mb-1">Timezone</label>
              <select
                value={setup.timezone}
                onChange={(e) => updateSetupStudio({ timezone: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text"
              >
                {allTimezones.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Waitlist toggle */}
            <div className="flex items-center justify-between py-2 px-4 bg-surface border border-border rounded-2xl">
              <div>
                <p className="text-sm font-medium text-text">Enable Waitlist</p>
                <p className="text-xs text-muted">Let customers join a waitlist when sessions are full</p>
              </div>
              <button
                onClick={() => updateSetupStudio({ waitlistEnabled: !setup.waitlistEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setup.waitlistEnabled ? 'bg-sage' : 'bg-border'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${setup.waitlistEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Card>
              <p className="text-sm text-muted mb-3">Add your studio rooms</p>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Capacity"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(e.target.value)}
                  className="w-24"
                />
                <Button onClick={handleAddRoom} className="px-3">
                  <Plus size={18} />
                </Button>
              </div>
            </Card>

            {setup.rooms.map((room) => (
              <Card key={room.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">{room.name}</p>
                  <p className="text-sm text-muted">Capacity: {room.capacity}</p>
                </div>
                <button onClick={() => removeSetupRoom(room.id)} className="p-2 text-muted">
                  <X size={18} />
                </button>
              </Card>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Card>
              <p className="text-sm text-muted mb-3">Add class types you offer</p>
              <div className="space-y-3">
                <Input
                  placeholder="Service name (e.g., Mat Pilates)"
                  value={stName}
                  onChange={(e) => setStName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Duration (min)"
                    value={stDuration}
                    onChange={(e) => setStDuration(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Capacity"
                    value={stCapacity}
                    onChange={(e) => setStCapacity(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setStColor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${stColor === c ? 'border-text' : 'border-transparent'}`}
                      style={{ backgroundColor: `var(--${c})` }}
                    />
                  ))}
                </div>
                <Button onClick={handleAddServiceType} fullWidth>
                  <Plus size={18} className="mr-2" /> Add Service
                </Button>
              </div>
            </Card>

            {setup.serviceTypes.map((st) => (
              <Card key={st.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `var(--${st.color})` }}
                  />
                  <div>
                    <p className="font-medium text-text">{st.name}</p>
                    <p className="text-sm text-muted">{st.durationMinutes} min</p>
                  </div>
                </div>
                <button onClick={() => removeSetupServiceType(st.id)} className="p-2 text-muted">
                  <X size={18} />
                </button>
              </Card>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Card>
              <p className="text-sm text-muted mb-3">Set up pricing options</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['SINGLE_SESSION', 'CREDIT_PACK', 'PACKAGE'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setProdType(t)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium ${prodType === t ? 'bg-sage text-white' : 'bg-border text-muted'}`}
                    >
                      {t === 'SINGLE_SESSION' ? 'Single' : t === 'CREDIT_PACK' ? 'Pack' : 'Package'}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Product name"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Price (₱)"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                />
                {prodType === 'CREDIT_PACK' && (
                  <Input
                    type="number"
                    placeholder="Credits"
                    value={prodCredits}
                    onChange={(e) => setProdCredits(e.target.value)}
                  />
                )}
                {prodType === 'PACKAGE' && (
                  <Input
                    type="number"
                    placeholder="Sessions"
                    value={prodSessions}
                    onChange={(e) => setProdSessions(e.target.value)}
                  />
                )}
                <Input
                  type="number"
                  placeholder="Expiry (days)"
                  value={prodExpiry}
                  onChange={(e) => setProdExpiry(e.target.value)}
                />
                <Button onClick={handleAddProduct} fullWidth>
                  <Plus size={18} className="mr-2" /> Add Product
                </Button>
              </div>
            </Card>

            {setup.products.map((prod) => (
              <Card key={prod.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">{prod.name}</p>
                  <p className="text-sm text-muted">
                    ₱{prod.price.toLocaleString()}
                    {prod.credits && ` • ${prod.credits} credits`}
                    {prod.sessions && ` • ${prod.sessions} sessions`}
                  </p>
                </div>
                <button onClick={() => removeSetupProduct(prod.id)} className="p-2 text-muted">
                  <X size={18} />
                </button>
              </Card>
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <Card>
              <p className="text-sm text-muted mb-3">Create recurring class schedules</p>
              <div className="space-y-3">
                <select
                  value={tplService}
                  onChange={(e) => setTplService(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text"
                >
                  <option value="">Select service...</option>
                  {setup.serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>

                <div>
                  <label className="block text-sm text-muted mb-2">Days of Week</label>
                  <div className="flex gap-1">
                    {DAYS.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={`flex-1 py-2 text-xs rounded-lg ${tplDays.includes(i) ? 'bg-sage text-white' : 'bg-border text-muted'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  type="time"
                  label="Start Time"
                  value={tplTime}
                  onChange={(e) => setTplTime(e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Capacity override (optional)"
                  value={tplCapacity}
                  onChange={(e) => setTplCapacity(e.target.value)}
                />

                <Button onClick={handleAddTemplate} fullWidth>
                  <Plus size={18} className="mr-2" /> Add Template
                </Button>
              </div>
            </Card>

            {setup.templates.map((tpl) => {
              const st = setup.serviceTypes.find((s) => s.id === tpl.serviceTypeId)
              return (
                <Card key={tpl.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text">{st?.name || 'Class'}</p>
                    <p className="text-sm text-muted">
                      {tpl.daysOfWeek.map((d) => DAYS[d]).join(', ')} at {tpl.startTime}
                    </p>
                  </div>
                  <button onClick={() => removeSetupTemplate(tpl.id)} className="p-2 text-muted">
                    <X size={18} />
                  </button>
                </Card>
              )
            })}
          </>
        )}

        {step === 5 && (
          <>
            <Card>
              <p className="text-sm text-muted mb-3">
                Optionally tag instructors to this studio. They can then claim sessions.
              </p>
              {allInstructors.length === 0 ? (
                <p className="text-sm text-muted italic">No instructor accounts exist yet. You can add them later.</p>
              ) : (
                <div className="space-y-2">
                  {allInstructors.map((inst) => {
                    const selected = setup.instructorIds.includes(inst.id)
                    return (
                      <button
                        key={inst.id}
                        onClick={() => {
                          const next = selected
                            ? setup.instructorIds.filter((id) => id !== inst.id)
                            : [...setup.instructorIds, inst.id]
                          setSetupInstructors(next)
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
                          selected ? 'border-sage bg-sage/10' : 'border-border bg-surface'
                        }`}
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-text">{inst.name ?? inst.email}</p>
                          {inst.name && inst.email && (
                            <p className="text-xs text-muted">{inst.email}</p>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selected ? 'border-sage bg-sage' : 'border-border'
                        }`}>
                          {selected && <Check size={11} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {step === 6 && (
          <>
            <Card>
              <h3 className="font-semibold text-text mb-2">Ready to Generate</h3>
              <p className="text-sm text-muted mb-4">
                Sessions will be created based on your templates for the next{' '}
                <strong>{setup.generateDays} days</strong>.
              </p>

              <div className="flex gap-2 mb-4">
                <Button
                  variant={setup.generateDays === 14 ? 'primary' : 'secondary'}
                  onClick={() => setGenerateDays(14)}
                  fullWidth
                >
                  14 Days
                </Button>
                <Button
                  variant={setup.generateDays === 28 ? 'primary' : 'secondary'}
                  onClick={() => setGenerateDays(28)}
                  fullWidth
                >
                  28 Days
                </Button>
              </div>

              <div className="bg-sage/10 rounded-xl p-3 text-sm text-sage">
                <Check size={16} className="inline mr-2" />
                {setup.templates.length} template(s) × ~{setup.generateDays / 7 * setup.templates.reduce((acc, t) => acc + t.daysOfWeek.length, 0)} sessions
              </div>
            </Card>

            <Card>
              <h4 className="font-medium text-text mb-2">Summary</h4>
              <ul className="text-sm text-muted space-y-1">
                <li>Studio: {setup.studioName}</li>
                <li>Rooms: {setup.rooms.length}</li>
                <li>Services: {setup.serviceTypes.length}</li>
                <li>Products: {setup.products.length}</li>
                <li>Templates: {setup.templates.length}</li>
                <li>Instructors: {setup.instructorIds.length}</li>
                <li>Waitlist: {setup.waitlistEnabled ? 'Enabled' : 'Disabled'}</li>
              </ul>
            </Card>
          </>
        )}
      </div>

      {/* Navigation - inline at bottom of content */}
      <div className="sticky bottom-0 bg-surface border-t border-border p-4 flex gap-3 -mx-4 mt-4">
        {step > 0 && (
          <Button variant="secondary" onClick={handleBack} className="px-4">
            <ChevronLeft size={18} />
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button fullWidth onClick={handleNext} disabled={!canNext()}>
            Next <ChevronRight size={18} className="ml-2" />
          </Button>
        ) : (
          <>
            {completeError && (
              <p className="text-xs text-red-500 text-center">{completeError}</p>
            )}
            <Button fullWidth onClick={handleComplete} disabled={completing}>
              {completing ? 'Saving…' : <>Complete Setup <Check size={18} className="ml-2" /></>}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
