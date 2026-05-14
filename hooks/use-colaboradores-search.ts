import { useState, useEffect } from 'react'

interface ColaboradorOption {
  id: string
  nome: string
  setor_nome?: string | null
}

export function useColaboradoresSearch() {
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ limit: '50', page: '1' })
      if (search) params.set('search', search)
      params.set('status', 'Ativo')

      const res = await fetch(`/api/colaboradores?${params}`)
      const json = await res.json()

      if (!cancelled) {
        setColaboradores(json.data || [])
        setLoading(false)
      }
    }, 300)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [search])

  return { colaboradores, loading, search, setSearch }
}
