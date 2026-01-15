import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Estudyo - Studio Booking App',
  description: 'Book Pilates, yoga, and fitness classes at studios near you. Mobile-first booking with credits, waitlists, and instant confirmation.',
  openGraph: {
    title: 'Estudyo - Studio Booking App',
    description: 'Book Pilates, yoga, and fitness classes at studios near you.',
    images: ['/og-image.svg'],
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
