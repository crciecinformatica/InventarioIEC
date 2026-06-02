'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { VinculosSection } from '@/components/forum/vinculos-section'
import { Search, Plus, MessageSquare, Eye, Pin, Lock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { pushInspectHistory } from '@/lib/navigation-context'

export default function ForumPage() {
  const [data, setData]     = useState<any[]>([])
  const [total, setTotal]   = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [refreshKey, setRefreshKey] = useState(0)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20', filtro })
    if (search) params.set('search', search)

    fetch(`/api/forum?${params}`)
      .then(r => r.json())
      .then(json => {
        if (!cancelledRef.current) {
          setData(json.data || [])
          setTotal(json.total || 0)
          setTotalPages(json.totalPages || 1)
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelledRef.current) setLoading(false) })

    return () => { cancelledRef.current = true }
  }, [page, search, filtro, refreshKey])

  useEffect(() => {
    pushInspectHistory(window.sessionStorage, {
      path: '/forum',
      inspectId: 'forum',
      type: 'forum',
      label: 'Fórum',
      title: 'Fórum',
      subtitle: 'Discussões e soluções do setor de TI',
      href: '/forum',
      timestamp: Date.now(),
    })
  }, [])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const filtros = ['todos', 'fixados', 'meus', 'vinculados']
  const filtroLabel: Record<string, string> = { todos: 'Todos', fixados: 'Fixados', meus: 'Meus tópicos', vinculados: 'Com itens' }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <PageHeader title="Fórum" description="Discussões e soluções do setor de TI" total={total}>
        <Link href="/forum/novo"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
          <Plus className="w-4 h-4" /> Novo tópico
        </Link>
      </PageHeader>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar tópicos..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1">
          {filtros.map(f => (
            <button key={f} type="button" onClick={() => { setFiltro(f); setPage(1) }}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition ${filtro === f ? 'bg-blue-600 text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {filtroLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum tópico encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(topico => (
            <Link key={topico.id} href={`/forum/${topico.id}`}
              className="block bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {topico.fixado && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        <Pin className="w-3 h-3" /> Fixado
                      </span>
                    )}
                    {topico.fechado && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        <Lock className="w-3 h-3" /> Fechado
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                      {topico.titulo}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {topico.conteudo}
                  </p>
                  <VinculosSection vinculos={topico.vinculos ?? []} />
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {topico._count?.comentarios ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {topico.views}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 text-right">
                    {topico.autor_nome}<br />
                    {formatDate(topico.created_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            ← Anterior
          </button>
          <span className="text-xs text-slate-500">{page} / {totalPages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Próximo →
          </button>
        </div>
      )}
    </div>
  )
}
