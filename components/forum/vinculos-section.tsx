'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { FORUM_TIPO_ITEM_CONFIG } from '@/lib/forum'

interface Vinculo { tipo_item: string; item_id: string; item_label: string }

export function VinculosSection({ vinculos, compact = false }: { vinculos: Vinculo[]; compact?: boolean }) {
  const router = useRouter()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)

  const groups = useMemo(() => {
    const map = new Map<string, Vinculo[]>()
    for (const vinculo of vinculos) {
      const list = map.get(vinculo.tipo_item) ?? []
      list.push(vinculo)
      map.set(vinculo.tipo_item, list)
    }
    return Array.from(map.entries()).map(([tipo, items]) => ({ tipo, items }))
  }, [vinculos])

  const open = groups.find(group => group.tipo === openGroup)

  useEffect(() => {
    if (!openGroup) return
    const close = () => {
      setOpenGroup(null)
      setAnchor(null)
    }
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('resize', close)
    }
  }, [openGroup])

  if (vinculos.length === 0) return null

  function openItem(v: Vinculo) {
    const cfg = FORUM_TIPO_ITEM_CONFIG[v.tipo_item as keyof typeof FORUM_TIPO_ITEM_CONFIG]
    if (!cfg) return
    router.push(`${cfg.href}?inspect=${v.item_id}`)
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {groups.map(group => {
        const cfg = FORUM_TIPO_ITEM_CONFIG[group.tipo as keyof typeof FORUM_TIPO_ITEM_CONFIG]
        if (!cfg) return null
        const Icon = cfg.icon
        const visible = compact ? group.items.slice(0, 1) : group.items.slice(0, 3)
        const hidden = group.items.length - visible.length
        const isOpen = openGroup === group.tipo

        return (
          <div key={group.tipo} className="relative">
            <div className="flex flex-wrap gap-1.5">
              {visible.map(item => (
                <button
                  key={`${item.tipo_item}-${item.item_id}`}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    openItem(item)
                  }}
                  className={`inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:brightness-125 ${cfg.chip}`}
                  title={item.item_label}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{item.item_label}</span>
                </button>
              ))}
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (isOpen) {
                      setOpenGroup(null)
                      setAnchor(null)
                      return
                    }
                    const rect = event.currentTarget.getBoundingClientRect()
                    setAnchor({
                      top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 336)),
                      left: Math.min(Math.max(12, rect.left), window.innerWidth - 340),
                    })
                    setOpenGroup(group.tipo)
                  }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition hover:brightness-125 ${cfg.chip}`}
                >
                  +{hidden} {cfg.label.toLowerCase()}
                  <ChevronDown className={`h-3 w-3 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>
        )
      })}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && anchor && (
            <>
              <button
                type="button"
                aria-label="Fechar vínculos"
                className="fixed inset-0 z-[70] cursor-default"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setOpenGroup(null)
                  setAnchor(null)
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.985 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="fixed z-[71] w-80 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl"
                style={{ top: anchor.top, left: anchor.left }}
              >
                {(() => {
                  const cfg = FORUM_TIPO_ITEM_CONFIG[open.tipo as keyof typeof FORUM_TIPO_ITEM_CONFIG]
                  const Icon = cfg.icon
                  return (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{open.items.length} {cfg.label}</p>
                        <button type="button" onClick={() => { setOpenGroup(null); setAnchor(null) }} className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="max-h-[min(18rem,calc(100vh-8rem))] overscroll-contain overflow-y-auto p-2">
                        {open.items.map(item => (
                          <button
                            key={`${item.tipo_item}-${item.item_id}`}
                            type="button"
                            onClick={() => openItem(item)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-900"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                            <span className="min-w-0 truncate">{item.item_label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
