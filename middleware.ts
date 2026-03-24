export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/studios/:path*',
    '/bookings/:path*',
    '/sessions/:path*',
    '/owner/:path*',
    '/instructor/:path*',
  ],
}
