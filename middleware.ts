import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

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

const authMiddleware = withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ token }) => {
      return Boolean(token)
    },
  },
})

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname

  if (SNOW_EXTERNAL_PATHS.some(pattern => pattern.test(pathname))) {
    if (hasSnowIntegrationToken(req)) return NextResponse.next()

    return NextResponse.json(
      { error: 'Token de integração SNOW inválido' },
      { status: 401 }
    )
  }

  return authMiddleware(req as NextRequestWithAuth, event)
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
