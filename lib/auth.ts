import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      // Upsert user into DB so FK constraints on Booking/Entitlement work
      const dbUser = await db.user.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name ?? '',
          image: user.image ?? null,
        },
        update: {
          name: user.name ?? '',
          image: user.image ?? null,
        },
      })
      // Override user.id with the DB cuid so jwt callback stores the right id
      user.id = dbUser.id
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? 'CUSTOMER'
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) ?? 'CUSTOMER'
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
}
