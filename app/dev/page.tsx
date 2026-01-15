'use client'

import { useStore } from '@/lib/store'
import { Card, Button, Banner } from '@/components/ui'
import { RotateCcw } from 'lucide-react'
import type { ScenarioId } from '@/lib/store/scenariosSlice'

const SCENARIOS: { id: ScenarioId; name: string; description: string }[] = [
  { id: 1, name: 'Credits Available', description: 'New user with 5 credits, plenty of availability' },
  { id: 2, name: 'No Entitlements', description: 'User with no credits (forces purchase flow)' },
  { id: 3, name: 'Full Class + Waitlist', description: 'Popular class is full with 3 people waiting' },
  { id: 4, name: 'Waitlist Offer', description: 'OFFERED state ready to accept (15 min timer)' },
  { id: 5, name: 'Locked Cancel', description: 'Booking within 24h - cancel disabled' },
]

export default function DevPage() {
  const simulateLatency = useStore((s) => s.simulateLatency)
  const simulateFailures = useStore((s) => s.simulateFailures)
  const latencyMs = useStore((s) => s.latencyMs)
  const failureRate = useStore((s) => s.failureRate)
  const setSimulateLatency = useStore((s) => s.setSimulateLatency)
  const setSimulateFailures = useStore((s) => s.setSimulateFailures)
  const setLatencyMs = useStore((s) => s.setLatencyMs)
  const setFailureRate = useStore((s) => s.setFailureRate)

  const activeScenario = useStore((s) => s.activeScenario)
  const scenarioLoading = useStore((s) => s.scenarioLoading)
  const loadScenario = useStore((s) => s.loadScenario)
  const resetDemoData = useStore((s) => s.resetDemoData)

  return (
    <div className="min-h-screen bg-bg p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">Dev Console</h1>

      {activeScenario && (
        <Banner
          message={`Demo: Scenario ${activeScenario} - ${SCENARIOS.find((s) => s.id === activeScenario)?.name}`}
          variant="info"
        />
      )}

      {/* Network Simulation */}
      <Card>
        <h2 className="font-semibold text-text mb-3">Network Simulation</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Simulate Latency</p>
              <p className="text-xs text-muted">Add delay to API calls</p>
            </div>
            <button
              onClick={() => setSimulateLatency(!simulateLatency)}
              className={`w-12 h-7 rounded-full transition-colors ${simulateLatency ? 'bg-sage' : 'bg-border'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${simulateLatency ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {simulateLatency && (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={latencyMs}
                onChange={(e) => setLatencyMs(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-muted w-16">{latencyMs}ms</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Simulate Failures</p>
              <p className="text-xs text-muted">Random API errors</p>
            </div>
            <button
              onClick={() => setSimulateFailures(!simulateFailures)}
              className={`w-12 h-7 rounded-full transition-colors ${simulateFailures ? 'bg-blush' : 'bg-border'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${simulateFailures ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {simulateFailures && (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={failureRate}
                onChange={(e) => setFailureRate(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-muted w-16">{Math.round(failureRate * 100)}%</span>
            </div>
          )}
        </div>
      </Card>

      {/* Demo Scenarios */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-text">Demo Scenarios</h2>
          <Button
            variant="ghost"
            className="text-xs px-2 py-1"
            onClick={resetDemoData}
          >
            <RotateCcw size={14} className="mr-1" /> Reset
          </Button>
        </div>
        <div className="space-y-2">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => loadScenario(scenario.id)}
              disabled={scenarioLoading}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                activeScenario === scenario.id
                  ? 'border-sage bg-sage/10'
                  : 'border-border hover:border-sage/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">
                    {scenario.id}. {scenario.name}
                  </p>
                  <p className="text-xs text-muted">{scenario.description}</p>
                </div>
                {activeScenario === scenario.id && (
                  <div className="w-2 h-2 rounded-full bg-sage" />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Quick Links */}
      <Card>
        <h2 className="font-semibold text-text mb-3">Quick Links</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/studios" className="px-3 py-2 bg-border rounded-lg text-sm text-text hover:bg-sage/20">
            Studios
          </a>
          <a href="/bookings" className="px-3 py-2 bg-border rounded-lg text-sm text-text hover:bg-sage/20">
            Bookings
          </a>
          <a href="/owner" className="px-3 py-2 bg-border rounded-lg text-sm text-text hover:bg-sage/20">
            Owner
          </a>
          <a href="/owner/setup" className="px-3 py-2 bg-border rounded-lg text-sm text-text hover:bg-sage/20">
            Setup Wizard
          </a>
        </div>
      </Card>
    </div>
  )
}
