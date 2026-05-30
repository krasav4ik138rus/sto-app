import type { Context } from 'hono'

import type { AppBindings } from '../app'
import { AppError } from '../http/errors'

export type StoContext = Awaited<ReturnType<typeof getStoContext>>

export async function getStoContext(c: Context<AppBindings>) {
  const auth = c.get('authService')
  const prisma = c.get('prisma')
  const authMe = await auth.getMe(bearerToken(c))

  const staffProfile = await prisma.staffProfile.findUnique({
    where: {
      userId: authMe.user.id,
    },
    include: {
      organization: true,
      serviceCenter: true,
    },
  })

  if (!staffProfile) {
    throw new AppError(
      403,
      'STO_STAFF_PROFILE_REQUIRED',
      'STO staff profile is required for this API',
    )
  }

  return {
    user: authMe.user,
    staffProfile,
    organization: staffProfile.organization,
    serviceCenter: staffProfile.serviceCenter,
    role: staffProfile.role,
  }
}

function bearerToken(c: Context) {
  const authorization = c.req.header('authorization')
  if (!authorization?.startsWith('Bearer ')) return undefined
  return authorization.slice('Bearer '.length)
}
