import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Estudyo - Studio Booking',
  description: 'Book your favorite classes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
