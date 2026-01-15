import { StateCreator } from 'zustand'
import type { AppStore } from './index'

export interface DevSlice {
  simulateLatency: boolean
  simulateFailures: boolean
  latencyMs: number
  failureRate: number // 0-1
  setSimulateLatency: (value: boolean) => void
  setSimulateFailures: (value: boolean) => void
  setLatencyMs: (ms: number) => void
  setFailureRate: (rate: number) => void
}

export const createDevSlice: StateCreator<AppStore, [], [], DevSlice> = (set) => ({
  simulateLatency: false,
  simulateFailures: false,
  latencyMs: 1500,
  failureRate: 0.3,
  setSimulateLatency: (value) => set({ simulateLatency: value }),
  setSimulateFailures: (value) => set({ simulateFailures: value }),
  setLatencyMs: (ms) => set({ latencyMs: ms }),
  setFailureRate: (rate) => set({ failureRate: rate }),
})

// Helper to wrap API calls with simulated latency/failures
export async function withDevSimulation<T>(
  store: AppStore,
  apiCall: () => Promise<T>
): Promise<T> {
  if (store.simulateLatency) {
    await new Promise((r) => setTimeout(r, store.latencyMs))
  }
  if (store.simulateFailures && Math.random() < store.failureRate) {
    throw new Error('Simulated API failure')
  }
  return apiCall()
}
