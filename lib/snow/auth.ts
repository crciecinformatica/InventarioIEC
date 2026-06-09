export function isSnowIntegrationAuthorized(request: Request) {
  const expected = process.env.SNOW_INTEGRATION_TOKEN
  if (!expected) {
    console.warn('[snow auth] SNOW_INTEGRATION_TOKEN não configurado')
    return false
  }

  const authorization = request.headers.get('authorization') || ''
  const apiKey = request.headers.get('x-api-key') || ''
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]

  return bearer === expected || apiKey === expected
}
