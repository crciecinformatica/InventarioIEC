'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X, Monitor, Laptop, Smartphone, Printer, Phone, Server } from 'lucide-react'

type TipoItem = 'maquinas' | 'notebooks' | 'aparelhos' | 'impressoras' | 'ramais' | 'racks'

const TIPOS: { value: TipoItem; label: string; icon: React.ElementType }[] = [
  { value: 'maquinas',   label: 'Máquina',    icon: Monitor    },
  { value: 'notebooks',  label: 'Notebook',   icon: Laptop     },
  { value: 'aparelhos',  label: 'Aparelho',   icon: Smartphone },
  { value: 'impressoras',label: 'Impressora', icon: Printer    },
  { value: 'ramais',     label: 'Ramal',      icon: Phone      },
  { value: 'racks',      label: 'Rack',       icon: Server     },
]

interface Vinculo { tipo_item: string; item_id: string; item_label: string }

interface Props {
  vinculos: Vinculo[]
  onChange: (vinculos: Vinculo[]) => void
}

export function ItemVincularSelect({ vinculos, onChange }: Props) {
  const [tipo, setTipo]       = useState<TipoItem>('maquinas')
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/inventario/search?tipo=${tipo}&q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setResults(json.results || [])
        setOpen(true)
      } finally { setLoading(false) }
    }, 300)
  }, [query, tipo])

  function addVinculo(result: any) {
    const label = result.label
    if (vinculos.find(v => v.item_id === result.id)) return
    onChange([...vinculos, { tipo_item: tipo, item_id: result.id, item_label: label }])
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function removeVinculo(item_id: string) {
    onChange(vinculos.filter(v => v.item_id !== item_id))
  }

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Vincular itens do inventário
      </p>

      {/* Chips dos vínculos */}
      {vinculos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {vinculos.map(v => {
            const cfg = TIPOS.find(t => t.value === v.tipo_item)
            const Icon = cfg?.icon ?? Monitor
            return (
              <span key={v.item_id} className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900">
                <Icon className="w-3 h-3 shrink-0" />
                {v.item_label}
                <button type="button" onClick={() => removeVinculo(v.item_id)} className="ml-0.5 hover:text-red-500 transition">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Seletor de tipo */}
      <div className="flex gap-1 flex-wrap">
        {TIPOS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.value} type="button" onClick={() => { setTipo(t.value); setQuery(''); setResults([]) }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition ${tipo === t.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={`Buscar ${TIPOS.find(t => t.value === tipo)?.label.toLowerCase()}...`}
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400" />
        </div>
        {open && results.length > 0 && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {results.map(r => (
                <button key={r.id} type="button" onClick={() => addVinculo(r)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.label}</p>
                  {r.sub && <p className="text-xs text-slate-400">{r.sub}</p>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}