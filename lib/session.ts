import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

/** Returns the authenticated user ID or null */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}
