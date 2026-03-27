import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const { pathname } = req.nextUrl

    if (pathname.startsWith('/owner') && token?.role !== 'OWNER') {
      return NextResponse.redirect(new URL('/studios', req.url))
    }
    if (pathname.startsWith('/instructor') && token?.role !== 'INSTRUCTOR') {
      return NextResponse.redirect(new URL('/studios', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/studios/:path*',
    '/bookings/:path*',
    '/sessions/:path*',
    '/owner/:path*',
    '/instructor/:path*',
  ],
}
