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
    async signIn({ user, account }) {
      if (!user.email) return false
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
      user.id = dbUser.id
      ;(user as any).role = dbUser.role
      ;(user as any).onboarded = dbUser.onboarded
      ;(user as any).provider = account?.provider ?? 'google'
      return true
    },
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? 'CUSTOMER'
        token.onboarded = (user as any).onboarded ?? false
        token.provider = (user as any).provider ?? account?.provider ?? 'google'
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role ?? 'CUSTOMER'
        session.user.onboarded = token.onboarded ?? false
        session.user.provider = token.provider ?? 'google'
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
}
