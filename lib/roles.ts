export type UserRole = 'CUSTOMER' | 'OWNER' | 'INSTRUCTOR'

export function roleHome(role: string): string {
  switch (role) {
    case 'OWNER': return '/owner'
    case 'INSTRUCTOR': return '/instructor'
    default: return '/studios'
  }
}
