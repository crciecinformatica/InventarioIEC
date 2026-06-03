'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
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
  itemLabel?: string | null
}

export function DeviceCommentsPopover({ tipoItem, itemId, itemLabel }: Props) {
  const [items, setItems] = useState<DeviceForumComment[]>([])
  const [mounted, setMounted] = useState(false)
  const isPresent = useIsPresent()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!itemId && !itemLabel) return
    let cancelled = false
    const params = new URLSearchParams({ tipo_item: tipoItem })
    if (itemId) params.set('ids', itemId)
    if (itemLabel) params.set('labels', itemLabel)
    fetch(`/api/forum/vinculos-resumo?${params}`)
      .then(res => res.ok ? res.json() : { data: [] })
      .then(json => {
        if (!cancelled) {
          const bucket = (itemId ? json.data?.[itemId] : null) ?? (itemLabel ? json.data?.[itemLabel] : null)
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
        }
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => { cancelled = true }
  }, [tipoItem, itemId, itemLabel])

  if (!mounted || (!itemId && !itemLabel) || items.length === 0) return null

  return createPortal(
    <AnimatePresence initial={false}>
      {isPresent && (
        <motion.aside
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10, scale: 0.985 }}
          transition={{ duration: reduceMotion ? 0.08 : 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed right-4 top-4 z-[90] w-[min(360px,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:right-6 md:top-6"
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Fórum vinculado</p>
            <p className="text-xs text-slate-400">{items.length} registro(s) relacionado(s)</p>
          </div>
          <div className="max-h-[min(360px,46vh)] space-y-2 overflow-y-auto overscroll-contain p-3">
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
    </AnimatePresence>,
    document.body
  )
}
