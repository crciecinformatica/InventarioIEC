'use client'
import { useState } from 'react'
import { useColaboradoresSearch } from '@/hooks/use-colaboradores-search'
import { Search, X, Loader2 } from 'lucide-react'

interface Props {
  value: string       // colaborador_id selecionado
  onChange: (id: string, nome: string) => void
  onClear: () => void
  selectedNome?: string | null
}

export function ColaboradorSelect({ value, onChange, onClear, selectedNome }: Props) {
  const { colaboradores, loading, search, setSearch } = useColaboradoresSearch()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
          <span className="text-sm text-green-800 dark:text-green-300 flex-1 truncate">{selectedNome}</span>
          <button
            type="button"
            onClick={onClear}
            className="text-green-500 hover:text-green-700 dark:hover:text-green-300 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div>
          <div
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Buscar colaborador..."
              className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {loading && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />}
          </div>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {colaboradores.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {loading ? 'Buscando...' : 'Nenhum colaborador encontrado.'}
                  </p>
                ) : (
                  colaboradores.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { onChange(c.id, c.nome); setOpen(false); setSearch('') }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{c.nome}</p>
                      {c.setor_nome && <p className="text-xs text-slate-400">{c.setor_nome}</p>}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
