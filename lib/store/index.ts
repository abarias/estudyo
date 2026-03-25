import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createCatalogSlice, CatalogSlice } from './catalogSlice'
import { createScheduleSlice, ScheduleSlice } from './scheduleSlice'
import { createWalletSlice, WalletSlice } from './walletSlice'
import { createBookingSlice, BookingSlice } from './bookingSlice'
import { createNotificationsSlice, NotificationsSlice } from './notificationsSlice'
import { createDevSlice, DevSlice } from './devSlice'
import { createSetupSlice, SetupSlice } from './setupSlice'
import { createScenariosSlice, ScenariosSlice } from './scenariosSlice'
import { createAuthSlice, AuthSlice } from './authSlice'
import { rehydrateMockStore } from '@/lib/mockStore'

export type AppStore = AuthSlice & CatalogSlice & ScheduleSlice & WalletSlice & BookingSlice & NotificationsSlice & DevSlice & SetupSlice & ScenariosSlice

export const useStore = create<AppStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createAuthSlice(...a),
        ...createCatalogSlice(...a),
        ...createScheduleSlice(...a),
        ...createWalletSlice(...a),
        ...createBookingSlice(...a),
        ...createNotificationsSlice(...a),
        ...createDevSlice(...a),
        ...createSetupSlice(...a),
        ...createScenariosSlice(...a),
      }),
      {
        name: 'estudyo-store',
        // Only persist auth identity + wallet + bookings
        partialize: (state) => ({
          userId: state.userId,
          userName: state.userName,
          userEmail: state.userEmail,
          userImage: state.userImage,
          entitlements: state.entitlements,
          totalCredits: state.totalCredits,
          bookings: state.bookings,
          waitlistEntries: state.waitlistEntries,
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) return
          // Restore persisted data back into the in-memory mock store so that
          // subsequent API calls (loadBookings, loadWallet, etc.) return the
          // correct data instead of empty arrays.
          rehydrateMockStore({
            bookings: state.bookings,
            entitlements: state.entitlements,
            waitlistEntries: state.waitlistEntries,
          })
        },
      }
    ),
    { name: 'estudyo-store' }
  )
)
