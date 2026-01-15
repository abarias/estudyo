import { StateCreator } from 'zustand'
import type { AppStore } from './index'
import type { Entitlement, Product } from '@/types/domain'
import * as api from '@/lib/api'
import { withDevSimulation } from './devSlice'

export interface WalletSlice {
  entitlements: Entitlement[]
  products: Product[]
  totalCredits: number
  walletLoading: boolean
  loadWallet: () => Promise<void>
  loadProducts: (studioId?: string) => Promise<void>
  purchaseProduct: (productId: string) => Promise<boolean>
  updateEntitlementOptimistic: (entitlementId: string, updates: Partial<Entitlement>) => void
}

export const createWalletSlice: StateCreator<AppStore, [], [], WalletSlice> = (set, get) => ({
  entitlements: [],
  products: [],
  totalCredits: 0,
  walletLoading: false,

  loadWallet: async () => {
    set({ walletLoading: true })
    try {
      const wallet = await withDevSimulation(get(), () => api.getWallet('user-1'))
      set({
        entitlements: wallet.entitlements,
        totalCredits: wallet.totalCredits,
        walletLoading: false,
      })
    } catch {
      set({ walletLoading: false })
    }
  },

  loadProducts: async (studioId) => {
    try {
      const products = await withDevSimulation(get(), () => api.getProducts(studioId))
      set({ products })
    } catch {
      // ignore
    }
  },

  purchaseProduct: async (productId) => {
    try {
      const result = await withDevSimulation(get(), () => api.purchaseProduct('user-1', productId))
      if (result.success) {
        await get().loadWallet()
        return true
      }
      return false
    } catch {
      return false
    }
  },

  updateEntitlementOptimistic: (entitlementId, updates) => {
    set((state) => ({
      entitlements: state.entitlements.map((e) =>
        e.id === entitlementId ? { ...e, ...updates } : e
      ),
      totalCredits: state.entitlements.reduce((sum, e) => {
        if (e.id === entitlementId) {
          return sum + (updates.remaining ?? e.remaining)
        }
        return sum + e.remaining
      }, 0),
    }))
  },
})
