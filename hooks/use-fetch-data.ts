'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FetchState<T> {
  data: T[]
  total: number
  totalPages: number
  loading: boolean
}

export function useFetchData<T>(
  endpoint: string,
  params: Record<string, string>,
  page: number,
  refreshKey: number
) {
  const router = useRouter()
  const [state, setState] = useState<FetchState<T>>({
    data: [],
    total: 0,
    totalPages: 1,
    loading: true,
  })
  const retryCount = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setState(prev => ({ ...prev, loading: true }))

      const searchParams = new URLSearchParams({ page: String(page), limit: '20' })
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.set(key, value)
      })

      try {
        const res = await fetch(`/api/${endpoint}?${searchParams}`)

        if (res.status === 401) {
          // Tentar novamente uma vez antes de redirecionar
          if (retryCount.current < 2) {
            retryCount.current++
            setTimeout(fetchData, 500)
            return
          }
          router.push('/login')
          return
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const json = await res.json()

        if (!cancelled) {
          retryCount.current = 0
          setState({
            data: json.data || [],
            total: json.total || 0,
            totalPages: json.totalPages || 1,
            loading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          console.error(`[${endpoint}]`, error)
          toast.error('Erro ao carregar dados. Tentando novamente...')
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, refreshKey, endpoint, router, JSON.stringify(params)])

  return state
}