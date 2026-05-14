'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function isReadRequest(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method.toUpperCase() === 'GET'
  if (typeof input !== 'string' && !(input instanceof URL)) return input.method.toUpperCase()
  return true
}

function isInternalApiRequest(input: RequestInfo | URL) {
  const url = getRequestUrl(input)

  if (url.startsWith('/api/')) return true

  if (typeof window === 'undefined') return false

  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')
  } catch {
    return false
  }
}

async function getApiErrorMessage(response: Response) {
  const fallback = `A API retornou erro ${response.status}.`

  try {
    const json = await response.clone().json()
    if (typeof json?.error === 'string') return json.error
    if (typeof json?.message === 'string') return json.message
  } catch {
    return fallback
  }

  return fallback
}

export function ApiRequestToasts() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input, init) => {
      if (!isInternalApiRequest(input)) {
        return originalFetch(input, init)
      }

      const isRead = isReadRequest(input, init)

      try {
        const response = await originalFetch(input, init)

        if (!response.ok && isRead) {
          toast.error('Erro ao carregar dados.', {
            description: await getApiErrorMessage(response),
          })
        }

        return response
      } catch (error) {
        if (isRead) {
          toast.error('Falha de conexão com a API.', {
            description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
          })
        }

        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
