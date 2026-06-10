export function isSnowIntegrationAuthorized(request: Request) {
  const expected = process.env.SNOW_INTEGRATION_TOKEN?.trim()
  if (!expected) {
    console.warn('[snow auth] SNOW_INTEGRATION_TOKEN não configurado')
    return false
  }

  const authorization = request.headers.get('authorization') || ''
  const apiKey = request.headers.get('x-api-key')?.trim() || ''
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()

  return bearer === expected || apiKey === expected
}
