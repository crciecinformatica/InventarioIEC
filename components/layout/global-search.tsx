'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Search, X, Loader2,
  Users, Monitor, Laptop, Smartphone, Printer, Phone, ArrowRight,
} from 'lucide-react'
import { writePendingInspectPreview } from '@/lib/navigation-context'

type TipoResult = 'colaborador' | 'maquina' | 'notebook' | 'aparelho' | 'ramal' | 'impressora'

interface SearchResult {
  id: string
  tipo: TipoResult
  label: string
  sub: string
  meta: string
  href: string
}

interface DropdownPos {
  top: number
  left: number
  width: number
}

const TIPO_CONFIG: Record<TipoResult, {
  icon: React.ElementType
  color: string
  bg: string
  label: string
}> = {
  colaborador: { icon: Users,      color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/50',     label: 'Colaborador' },
  maquina:     { icon: Monitor,    color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-950/50', label: 'Máquina'     },
  notebook:    { icon: Laptop,     color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-950/50', label: 'Notebook'    },
  aparelho:    { icon: Smartphone, color: 'text-cyan-600 dark:text-cyan-400',      bg: 'bg-cyan-50 dark:bg-cyan-950/50',     label: 'Aparelho'    },
  ramal:       { icon: Phone,      color: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-950/50',label: 'Ramal'      },
  impressora:  { icon: Printer,    color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-950/50',   label: 'Impressora'  },
}

function groupResults(results: SearchResult[]) {
  const order: TipoResult[] = ['colaborador', 'maquina', 'notebook', 'aparelho', 'ramal', 'impressora']
  const groups: Record<string, SearchResult[]> = {}
  for (const r of results) {
    if (!groups[r.tipo]) groups[r.tipo] = []
    groups[r.tipo].push(r)
  }
  return order.filter(t => groups[t]?.length > 0).map(t => ({ tipo: t, items: groups[t] }))
}

interface Props {
  className?: string
}

export function GlobalSearch({ className = '' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [pos, setPos] = useState<DropdownPos | null>(null)
  const [mounted, setMounted] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  function calcPos() {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    })
  }

  // Debounce da busca
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setResults(json.results || [])
        calcPos()
        setOpen(true)
        setActiveIndex(-1)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Recalcular posição ao scroll/resize
  useEffect(() => {
    if (!open) return
    const handler = () => calcPos()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open])

  // FIX: fechar ao clicar fora usando mousedown — mas ignorar cliques dentro
  // do dropdown (que vive no portal, fora do wrapperRef)
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node
      const insideWrapper  = wrapperRef.current?.contains(target)
      const insideDropdown = dropdownRef.current?.contains(target)
      if (!insideWrapper && !insideDropdown) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Atalho Ctrl+K / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); navigateTo(results[activeIndex]) }
  }

  function navigateTo(result: SearchResult) {
    setOpen(false)
    setQuery('')
    setResults([])
    writePendingInspectPreview(window.sessionStorage, result.href, {
      title: result.label,
      subtitle: [result.sub, result.meta].filter(Boolean).join(' · '),
    })
    router.push(result.href)
  }

  function clear() {
    setQuery('')
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const groups = groupResults(results)
  const flatResults = groups.flatMap(g => g.items)

  const dropdown = mounted && open && pos ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
      }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
    >
      {results.length === 0 && !loading && query.length >= 2 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Nenhum resultado para "{query}"
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Tente buscar por outro termo
          </p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto py-2">
          {groups.map(({ tipo, items }) => {
            const cfg = TIPO_CONFIG[tipo]
            const Icon = cfg.icon
            return (
              <div key={tipo}>
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <Icon className={`w-3 h-3 ${cfg.color}`} />
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {cfg.label}
                  </span>
                </div>
                {items.map(result => {
                  const flatIdx = flatResults.indexOf(result)
                  const isActive = flatIdx === activeIndex
                  return (
                    <button
                      key={result.id}
                      type="button"
                      // FIX: onMouseDown com preventDefault impede que o blur do input
                      // dispare antes do click, garantindo que a navegação sempre ocorra
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => navigateTo(result)}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      className={`
                        w-full text-left flex items-center gap-3 px-4 py-2.5 transition
                        ${isActive ? 'bg-slate-50 dark:bg-slate-700/60' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {result.label}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {result.sub && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{result.sub}</span>
                          )}
                          {result.meta && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                              {result.meta}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition ${isActive ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {results.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </span>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">↵</kbd>
              abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">esc</kbd>
              fechar
            </span>
          </div>
        </div>
      )}
    </div>,
    document.body
  ) : null

  return (
    <div ref={wrapperRef} className={className}>
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border transition-all w-full
        bg-white dark:bg-slate-800
        ${open
          ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/20 dark:ring-blue-500/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }
      `}>
        {loading
          ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
          : <Search className="w-4 h-4 text-slate-400 shrink-0" />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) { calcPos(); setOpen(true) } }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar colaboradores, máquinas, ramais..."
          className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 min-w-0"
        />
        {query ? (
          <button type="button" onClick={clear}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition shrink-0">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 shrink-0">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        )}
      </div>

      {dropdown}
    </div>
  )
}
