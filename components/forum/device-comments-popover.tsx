'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { formatDate } from '@/lib/utils'

interface DeviceForumComment {
  id: string
  topico_id: string
  topico_titulo: string
  autor_nome: string
  conteudo: string
  tipo: string
  expira_em: string | null
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
    const params = new URLSearchParams({ tipo_item: tipoItem, item_id: itemId })
    fetch(`/api/forum/comentarios-vinculados?${params}`)
      .then(res => res.ok ? res.json() : { data: [] })
      .then(json => {
        if (!cancelled) {
          const data = Array.isArray(json.data) ? json.data : []
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
    <div className="fixed left-3 top-24 z-[55] max-w-[calc(100vw-1.5rem)] md:left-4">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="rounded-r-lg rounded-l-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
      >
        Fórum ({items.length})
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
            transition={{ duration: 0.18 }}
            className="mt-2 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Comentários vinculados</p>
              <p className="text-xs text-slate-400">Permanentes e temporários válidos</p>
            </div>
            <div className="max-h-[52vh] space-y-2 overflow-y-auto p-3">
              {items.map(item => (
                <Link
                  key={item.id}
                  href={`/forum/${item.topico_id}`}
                  className="block rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
                >
                  <p className="line-clamp-1 text-xs font-semibold text-slate-500">{item.topico_titulo}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-700 dark:text-slate-300">{item.conteudo}</p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {item.autor_nome} · {formatDate(item.created_at)}
                    {item.tipo === 'temporario' && item.expira_em ? ` · expira ${formatDate(item.expira_em)}` : ''}
                  </p>
                </Link>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
