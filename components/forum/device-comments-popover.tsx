'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MessageSquare, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ForumEtiquetaBadges } from '@/components/forum/forum-etiquetas'

interface DeviceForumComment {
  id: string
  topico_id: string
  topico_titulo: string
  autor_nome: string
  conteudo: string
  tipo: string
  expira_em: string | null
  etiquetas?: string[]
  origem?: 'topico' | 'comentario'
  created_at: string | null
}

interface Props {
  tipoItem: string
  itemId?: string | null
}

export function DeviceCommentsPopover({ tipoItem, itemId }: Props) {
  const [items, setItems] = useState<DeviceForumComment[]>([])
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!itemId) return
    let cancelled = false
    const params = new URLSearchParams({ tipo_item: tipoItem, ids: itemId })
    fetch(`/api/forum/vinculos-resumo?${params}`)
      .then(res => res.ok ? res.json() : { data: [] })
      .then(json => {
        if (!cancelled) {
          const bucket = json.data?.[itemId]
          const data = Array.isArray(bucket?.items) ? bucket.items.map((item: any) => ({
            id: item.id,
            topico_id: item.topico_id,
            topico_titulo: item.topico_titulo,
            autor_nome: item.autor_nome,
            conteudo: item.conteudo,
            tipo: item.origem ?? 'topico',
            expira_em: null,
            etiquetas: item.etiquetas,
            origem: item.origem,
            created_at: item.created_at,
          })) : []
          setItems(data)
          setOpen(data.length > 0)
        }
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => { cancelled = true }
  }, [tipoItem, itemId])

  if (!itemId || items.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex max-w-[calc(100vw-2rem)] items-start gap-3 md:right-6 md:top-6">
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto relative w-[min(360px,calc(100vw-5.5rem))] rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="absolute -right-2 top-4 h-4 w-4 rotate-45 border-r border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Fórum vinculado</p>
                  <p className="text-xs text-slate-400">{items.length} registro(s) relacionado(s)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Ocultar fórum vinculado"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[min(360px,46vh)] space-y-2 overflow-y-auto p-3">
              {items.map(item => (
                <Link
                  key={item.id}
                  href={`/forum/${item.topico_id}`}
                  className="block rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
                >
                  <p className="line-clamp-1 text-xs font-semibold text-slate-500">{item.topico_titulo}</p>
                  <ForumEtiquetaBadges etiquetas={item.etiquetas as any} />
                  <p className="mt-2 line-clamp-3 text-sm text-slate-700 dark:text-slate-300">{item.conteudo}</p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {item.origem === 'comentario' ? 'Comentário' : 'Tópico'} · {item.autor_nome} · {formatDate(item.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="pointer-events-auto relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-950/40 ring-1 ring-blue-400/40 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
        aria-label={open ? 'Ocultar fórum vinculado' : 'Exibir fórum vinculado'}
      >
        <MessageSquare className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-slate-950 bg-white px-1 text-[10px] font-bold text-slate-950">
          {items.length}
        </span>
      </button>
    </div>
  )
}
