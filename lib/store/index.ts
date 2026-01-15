import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createCatalogSlice, CatalogSlice } from './catalogSlice'
import { createScheduleSlice, ScheduleSlice } from './scheduleSlice'
import { createWalletSlice, WalletSlice } from './walletSlice'
import { createBookingSlice, BookingSlice } from './bookingSlice'
import { createNotificationsSlice, NotificationsSlice } from './notificationsSlice'
import { createDevSlice, DevSlice } from './devSlice'

export type AppStore = CatalogSlice & ScheduleSlice & WalletSlice & BookingSlice & NotificationsSlice & DevSlice

export const useStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createCatalogSlice(...a),
      ...createScheduleSlice(...a),
      ...createWalletSlice(...a),
      ...createBookingSlice(...a),
      ...createNotificationsSlice(...a),
      ...createDevSlice(...a),
    }),
    { name: 'estudyo-store' }
  )
)
