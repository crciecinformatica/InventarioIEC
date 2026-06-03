'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, MessageSquare, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ForumEtiquetaBadges } from '@/components/forum/forum-etiquetas'

export type ForumResumoItem = {
  id: string
  topico_id: string
  topico_titulo: string
  autor_nome: string
  conteudo: string
  origem: 'topico' | 'comentario'
  etiquetas: string[]
  created_at: string | null
  comentarios_count: number
}

export type ForumResumo = {
  count: number
  items: ForumResumoItem[]
}

export function useForumVinculosResumo(tipoItem: string, ids: Array<string | undefined | null>) {
  const idsKey = ids.filter((id): id is string => Boolean(id)).join(',')
  const [data, setData] = useState<Record<string, ForumResumo>>({})

  useEffect(() => {
    const stableIds = Array.from(new Set(idsKey.split(',').filter(Boolean)))
    if (!tipoItem || stableIds.length === 0) {
      setData({})
      return
    }
    let cancelled = false
    const params = new URLSearchParams({ tipo_item: tipoItem, ids: stableIds.join(',') })
    fetch(`/api/forum/vinculos-resumo?${params}`)
      .then(res => res.ok ? res.json() : { data: {} })
      .then(json => {
        if (!cancelled) setData(json.data || {})
      })
      .catch(() => {
        if (!cancelled) setData({})
      })
    return () => { cancelled = true }
  }, [tipoItem, idsKey])

  return data
}

export function ForumLinkedIndicator({
  resumo,
  className = '',
}: {
  resumo?: ForumResumo
  className?: string
}) {
  const [open, setOpen] = useState(false)
  if (!resumo || resumo.count === 0) return <span className="text-xs text-slate-500">—</span>

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen(value => !value)
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-blue-700/60 bg-blue-950/70 px-2.5 py-1 text-xs font-semibold text-blue-200 shadow-sm transition hover:border-blue-500 hover:bg-blue-900"
        title="Ativo vinculado ao fórum"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {resumo.count}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label="Fechar fórum"
              className="fixed inset-0 z-30 cursor-default"
              onClick={(event) => {
                event.stopPropagation()
                setOpen(false)
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-full z-40 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Vínculos no fórum</p>
                  <p className="text-xs text-slate-500">{resumo.count} registro(s) relacionado(s)</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-3">
                {resumo.items.map(item => (
                  <Link
                    key={`${item.origem}-${item.id}`}
                    href={`/forum/${item.topico_id}`}
                    className="mb-2 block rounded-xl border border-slate-800 bg-slate-900/70 p-3 transition hover:border-blue-700/60 hover:bg-slate-900"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-100">{item.topico_titulo}</p>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                    </div>
                    <ForumEtiquetaBadges etiquetas={item.etiquetas as any} />
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">{item.conteudo}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {item.origem === 'comentario' ? 'Comentário' : 'Tópico'} · {item.autor_nome} · {formatDate(item.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
