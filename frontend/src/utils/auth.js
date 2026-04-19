import { ROLES } from '../constants/roles'

export const getHomeRouteForUser = (user) => {
  if (!user) return '/login'
  if (user.mustChangePassword) return '/change-password'
  if (user.role === ROLES.STUDENT && !user.profileCompleted) return '/student/profile'

  const normalizedRole = String(user.role || '').toUpperCase()

  if (normalizedRole === ROLES.ADMIN) return '/admin'
  if (normalizedRole === ROLES.COORDINATOR) return '/coordinator'
  if (normalizedRole === ROLES.GATEKEEPER) return '/gate'
  if (normalizedRole === ROLES.INSTRUCTOR) return '/instructor'
  if (normalizedRole === ROLES.STUDENT) return '/student'

  return '/login'
}
