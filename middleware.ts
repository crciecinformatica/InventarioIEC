import { withAuth } from 'next-auth/middleware'

const SNOW_EXTERNAL_PATHS = [
  /^\/api\/snow\/processar-xlsx$/,
  /^\/api\/snow\/itens\/[^/]+\/assumir$/,
  /^\/api\/snow\/itens\/[^/]+\/concluir$/,
]

function hasSnowIntegrationToken(req: Request) {
  const expected = process.env.SNOW_INTEGRATION_TOKEN
  if (!expected) return false

  const authorization = req.headers.get('authorization') || ''
  const apiKey = req.headers.get('x-api-key') || ''
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]

  return bearer === expected || apiKey === expected
}

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ req, token }) => {
      const pathname = req.nextUrl.pathname
      if (SNOW_EXTERNAL_PATHS.some(pattern => pattern.test(pathname))) {
        return hasSnowIntegrationToken(req)
      }

      return Boolean(token)
    },
  },
})

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
