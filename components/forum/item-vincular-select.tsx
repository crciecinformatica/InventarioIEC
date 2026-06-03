'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X, Monitor, Laptop, Smartphone, Printer, Phone, Server, Layers3, ListChecks, MapPin, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { SetorSelect } from '@/components/modals/setor-select'
import { LocalidadeSelect } from '@/components/modals/localidade-select'

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
  const [modo, setModo]       = useState<'busca' | 'grupo'>('busca')
  const [escopo, setEscopo]   = useState<'todos' | 'setor' | 'localidade'>('todos')
  const [setorId, setSetorId] = useState<string | null>(null)
  const [localidadeId, setLocalidadeId] = useState<string | null>(null)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<any[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
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

  function addSelecionados() {
    const selected = results.filter(result => checkedIds.has(result.id))
    if (selected.length === 0) return
    const existing = new Set(vinculos.map(v => `${v.tipo_item}:${v.item_id}`))
    const next = selected
      .map(result => ({ tipo_item: tipo, item_id: result.id, item_label: result.label }))
      .filter(v => !existing.has(`${v.tipo_item}:${v.item_id}`))
    onChange([...vinculos, ...next])
    setQuery('')
    setResults([])
    setCheckedIds(new Set())
    setOpen(false)
  }

  async function addGrupoCompleto() {
    setBulkLoading(true)
    try {
      const params = new URLSearchParams({ tipo })
      if (escopo === 'setor' && setorId) params.set('setor_id', setorId)
      if (escopo === 'localidade' && localidadeId) params.set('localidade_id', localidadeId)
      const res = await fetch(`/api/inventario/bulk?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      const items = Array.isArray(json.results) ? json.results : []
      const existing = new Set(vinculos.map(v => `${v.tipo_item}:${v.item_id}`))
      const next = items
        .map((result: any) => ({ tipo_item: tipo, item_id: result.id, item_label: result.label }))
        .filter((v: Vinculo) => !existing.has(`${v.tipo_item}:${v.item_id}`))
      onChange([...vinculos, ...next])
      toast.success(`${next.length} ${TIPOS.find(t => t.value === tipo)?.label.toLowerCase()} anexado(s) ao fórum.`)
    } catch {
      toast.error('Erro ao anexar grupo de ativos.')
    } finally {
      setBulkLoading(false)
    }
  }

  function removeVinculo(tipo_item: string, item_id: string) {
    onChange(vinculos.filter(v => !(v.tipo_item === tipo_item && v.item_id === item_id)))
  }

  function toggleChecked(id: string) {
    setCheckedIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllResults() {
    setCheckedIds(current => {
      const next = new Set(current)
      const allSelected = results.length > 0 && results.every(result => next.has(result.id))
      if (allSelected) {
        results.forEach(result => next.delete(result.id))
      } else {
        results.forEach(result => next.add(result.id))
      }
      return next
    })
  }

  const bulkDisabled = bulkLoading || (escopo === 'setor' && !setorId) || (escopo === 'localidade' && !localidadeId)
  const tipoLabel = TIPOS.find(t => t.value === tipo)?.label ?? 'Itens'
  const scopeText = escopo === 'todos'
    ? 'todo o inventário'
    : escopo === 'setor'
      ? 'setor selecionado'
      : 'localidade selecionada'

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Vincular itens do inventário
      </p>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          onClick={() => setModo('busca')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${modo === 'busca' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-200'}`}
        >
          <Search className="h-3.5 w-3.5" />
          Busca individual
        </button>
        <button
          type="button"
          onClick={() => setModo('grupo')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${modo === 'grupo' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-200'}`}
        >
          <Layers3 className="h-3.5 w-3.5" />
          Grupo completo
        </button>
      </div>

      {/* Chips dos vínculos */}
      {vinculos.length > 0 && (
        <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">{vinculos.length} ativo(s) selecionado(s)</span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-400 transition hover:border-red-800 hover:bg-red-950/30 hover:text-red-200"
            >
              <X className="h-3.5 w-3.5" />
              Limpar ativos
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {vinculos.map(v => {
              const cfg = TIPOS.find(t => t.value === v.tipo_item)
              const Icon = cfg?.icon ?? Monitor
              return (
                <span
                  key={`${v.tipo_item}-${v.item_id}`}
                  className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900"
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="max-w-[180px] truncate">{v.item_label}</span>
                  <button type="button" onClick={() => removeVinculo(v.tipo_item, v.item_id)} className="ml-0.5 hover:text-red-500 transition">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
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

      {modo === 'grupo' ? (
        <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-blue-700/60 bg-blue-950 p-2 text-blue-200">
              <ListChecks className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">Anexar {tipoLabel.toLowerCase()} por grupo</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Escolha todos, por setor ou por localidade. Os vínculos continuam expandidos item por item.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: 'todos', label: 'Todos', icon: Layers3 },
                  { value: 'setor', label: 'Setor', icon: Building2 },
                  { value: 'localidade', label: 'Localidade', icon: MapPin },
                ].map(option => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEscopo(option.value as typeof escopo)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        escopo === option.value
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  )
                })}
              </div>
              {escopo === 'setor' && (
                <div className="mt-3 max-w-sm">
                  <SetorSelect value={setorId} onChange={(id) => setSetorId(id)} placeholder="Selecionar setor..." allowCreate={false} />
                </div>
              )}
              {escopo === 'localidade' && (
                <div className="mt-3 max-w-sm">
                  <LocalidadeSelect value={localidadeId} onChange={(id) => setLocalidadeId(id)} placeholder="Selecionar localidade..." />
                </div>
              )}
              <button
                type="button"
                onClick={addGrupoCompleto}
                disabled={bulkDisabled}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers3 className="h-3.5 w-3.5" />}
                {bulkLoading ? 'Anexando grupo...' : `Anexar ${tipoLabel}: ${scopeText}`}
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={`Buscar ${TIPOS.find(t => t.value === tipo)?.label.toLowerCase()}...`}
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500" />
          {checkedIds.size > 0 && (
            <button
              type="button"
              onClick={addSelecionados}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Confirmar ({checkedIds.size})
            </button>
          )}
        </div>
        {query.length > 0 && query.length < 2 && (
          <p className="mt-2 text-xs text-slate-500">Digite pelo menos 2 caracteres para buscar.</p>
        )}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                <span className="text-xs text-slate-500">{results.length} resultado(s)</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={toggleAllResults} className="text-xs font-semibold text-blue-300 hover:text-blue-200">
                    {results.length > 0 && results.every(r => checkedIds.has(r.id)) ? 'Limpar resultados' : 'Selecionar resultados'}
                  </button>
                  <button
                    type="button"
                    onClick={addSelecionados}
                    disabled={checkedIds.size === 0}
                    className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {results.length === 0 && !loading ? (
                  <p className="py-6 text-center text-xs text-slate-500">Nenhum item encontrado.</p>
                ) : results.map(r => (
                  <label key={r.id}
                    className="flex cursor-pointer items-start gap-3 border-b border-slate-800/70 px-3 py-3 transition last:border-0 hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(r.id)}
                      onChange={() => toggleChecked(r.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-200">{r.label}</span>
                      {r.sub && <span className="block text-xs text-slate-400">{r.sub}</span>}
                      {r.meta && <span className="block text-[11px] text-slate-500">{r.meta}</span>}
                    </span>
                  </label>
                ))}
              </div>
              <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-800 bg-slate-950 px-3 py-2">
                <span className="text-xs text-slate-500">{checkedIds.size} selecionado(s)</span>
                <button
                  type="button"
                  onClick={addSelecionados}
                  disabled={checkedIds.size === 0}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  Anexar selecionados
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  )
}
