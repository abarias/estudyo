'use client'

import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { useDev } from '@/lib/store'

export default function DevPanel() {
  const [open, setOpen] = useState(false)
  const {
    simulateLatency, setSimulateLatency,
    simulateFailures, setSimulateFailures,
    latencyMs, setLatencyMs,
    failureRate, setFailureRate,
  } = useDev()

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-30 w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center text-muted hover:bg-muted/30 transition-colors"
        aria-label="Dev settings"
      >
        <Settings size={18} />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-surface rounded-t-2xl sm:rounded-2xl p-4 w-full max-w-sm m-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text">Dev Settings</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-muted hover:text-text">
                <X size={18} />
              </button>
            </div>

            <label className="flex items-center justify-between">
              <span className="text-sm text-text">Simulate Latency</span>
              <input
                type="checkbox"
                checked={simulateLatency}
                onChange={(e) => setSimulateLatency(e.target.checked)}
                className="w-5 h-5 accent-sage"
              />
            </label>

            {simulateLatency && (
              <label className="block">
                <span className="text-xs text-muted">Latency (ms): {latencyMs}</span>
                <input
                  type="range"
                  min={200}
                  max={5000}
                  step={100}
                  value={latencyMs}
                  onChange={(e) => setLatencyMs(Number(e.target.value))}
                  className="w-full accent-sage"
                />
              </label>
            )}

            <label className="flex items-center justify-between">
              <span className="text-sm text-text">Simulate Failures</span>
              <input
                type="checkbox"
                checked={simulateFailures}
                onChange={(e) => setSimulateFailures(e.target.checked)}
                className="w-5 h-5 accent-sage"
              />
            </label>

            {simulateFailures && (
              <label className="block">
                <span className="text-xs text-muted">Failure Rate: {Math.round(failureRate * 100)}%</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={failureRate}
                  onChange={(e) => setFailureRate(Number(e.target.value))}
                  className="w-full accent-sage"
                />
              </label>
            )}

            <p className="text-xs text-muted">
              These settings affect all API calls for testing optimistic updates and error handling.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
