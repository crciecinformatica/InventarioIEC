'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, FolderOpen, Loader2, Search, X } from 'lucide-react'

export interface ForumPastaSelecionada {
  id: string
  nome: string
  caminho?: string | null
  descricao?: string | null
  _count?: { arquivos?: number; filhos?: number }
}

interface Props {
  value: ForumPastaSelecionada[]
  onChange: (pastas: ForumPastaSelecionada[]) => void
  title?: string
  description?: string
  placeholder?: string
  clearLabel?: string
}

export function ForumFolderSelect({
  value,
  onChange,
  title = 'Pastas relacionadas',
  description,
  placeholder = 'Buscar pasta existente...',
  clearLabel = 'Limpar pastas',
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ForumPastaSelecionada[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedKeys = useMemo(() => new Set(value.map(pasta => pasta.id)), [value])
  const checkedCount = checkedIds.size

  useEffect(() => {
    if (!open && !query.trim()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ flat: '1' })
        if (query.trim()) params.set('search', query.trim())
        const res = await fetch(`/api/forum/pastas?${params}`)
        const json = await res.json()
        setResults(Array.isArray(json.pastas) ? json.pastas : [])
      } finally {
        setLoading(false)
      }
    }, query.trim() ? 220 : 0)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [open, query])

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
      const visible = results.filter(pasta => !selectedKeys.has(pasta.id))
      const allSelected = visible.length > 0 && visible.every(pasta => current.has(pasta.id))
      const next = new Set(current)
      if (allSelected) visible.forEach(pasta => next.delete(pasta.id))
      else visible.forEach(pasta => next.add(pasta.id))
      return next
    })
  }

  function confirmSelection() {
    const existing = new Set(value.map(pasta => pasta.id))
    const next = results
      .filter(pasta => checkedIds.has(pasta.id) && !existing.has(pasta.id))
      .map(pasta => ({
        id: pasta.id,
        nome: pasta.nome,
        caminho: pasta.caminho ?? pasta.nome,
        descricao: pasta.descricao ?? null,
        _count: pasta._count,
      }))

    if (next.length > 0) onChange([...value, ...next])
    setCheckedIds(new Set())
    setQuery('')
    setOpen(false)
  }

  function removePasta(id: string) {
    onChange(value.filter(pasta => pasta.id !== id))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:border-red-800 hover:bg-red-950/30 hover:text-red-200"
          >
            <X className="h-3.5 w-3.5" />
            {clearLabel}
          </button>
        )}
      </div>
      {description && (
        <p className="text-xs leading-relaxed text-slate-500">{description}</p>
      )}

      {value.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
          <div className="flex flex-wrap gap-2">
            {value.map(pasta => (
              <span
                key={pasta.id}
                className="inline-flex max-w-[280px] items-center gap-1.5 rounded-full border border-violet-900 bg-violet-950 px-2.5 py-1 text-xs font-medium text-violet-200"
              >
                <FolderOpen className="h-3 w-3 shrink-0" />
                <span className="truncate">{pasta.caminho || pasta.nome}</span>
                <button type="button" onClick={() => removePasta(pasta.id)} className="ml-0.5 transition hover:text-red-300">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <Search className="h-4 w-4 text-slate-400" />}
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={event => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>

        {open && (
          <>
            <button type="button" aria-label="Fechar pastas" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                <span className="text-xs text-slate-500">{results.length} pasta(s)</span>
                <button type="button" onClick={toggleAllResults} className="text-xs font-semibold text-violet-300 transition hover:text-violet-200">
                  Selecionar visíveis
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {results.length === 0 && !loading ? (
                  <p className="py-6 text-center text-xs text-slate-500">Nenhuma pasta encontrada.</p>
                ) : results.map(pasta => {
                  const alreadySelected = selectedKeys.has(pasta.id)
                  return (
                    <label
                      key={pasta.id}
                      className={`flex cursor-pointer items-start gap-3 border-b border-slate-800/70 px-3 py-3 transition last:border-0 ${
                        alreadySelected ? 'opacity-50' : 'hover:bg-slate-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={alreadySelected}
                        checked={alreadySelected || checkedIds.has(pasta.id)}
                        onChange={() => toggleChecked(pasta.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-200">{pasta.caminho || pasta.nome}</span>
                        <span className="block text-xs text-slate-500">
                          {alreadySelected ? 'Já vinculada' : `${pasta._count?.arquivos ?? 0} arquivo(s)`}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-800 bg-slate-950 px-3 py-2">
                <span className="text-xs text-slate-500">{checkedCount} selecionada(s)</span>
                <button
                  type="button"
                  onClick={confirmSelection}
                  disabled={checkedCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirmar seleção
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
