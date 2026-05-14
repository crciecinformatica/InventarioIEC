'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Loader2, MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface SetorOption {
  id: string
  nome: string
  ativo: boolean
}

interface Props {
  value: string | null
  onChange: (id: string | null, nome: string | null) => void
  placeholder?: string
  disabled?: boolean
  allowCreate?: boolean
  className?: string
}

interface DropdownPos {
  top: number
  left: number
  width: number
}

export function SetorSelect({
  value,
  onChange,
  placeholder = 'Selecionar setor...',
  disabled = false,
  allowCreate = true,
  className = '',
}: Props) {
  const [setores, setSetores] = useState<SetorOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [pos, setPos] = useState<DropdownPos | null>(null)

  const triggerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedNome = value
    ? setores.find(s => s.id === value)?.nome ?? null
    : null

  function calcPos() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }

  function handleOpen() {
    if (disabled) return
    calcPos()
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Recalcular ao scroll ou resize
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

  // Buscar setores
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ all: 'true', ativo: 'true' })
        if (search) params.set('search', search)
        const res = await fetch(`/api/setores?${params}`)
        const json = await res.json()
        setSetores(Array.isArray(json) ? json : [])
      } catch {
        setSetores([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, open])

  async function handleCreate() {
    if (!novoNome.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/setores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome.trim() }),
      })
      if (res.status === 409) { toast.error('Setor já cadastrado.'); return }
      if (!res.ok) throw new Error()
      const novo = await res.json()
      setSetores(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
      onChange(novo.id, novo.nome)
      setOpen(false)
      setSearch('')
      setNovoNome('')
      toast.success(`Setor "${novo.nome}" criado!`)
    } catch {
      toast.error('Erro ao criar setor.')
    } finally {
      setCreating(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setSearch('')
  }

  const dropdown = open && pos && typeof document !== 'undefined' ? createPortal(
    <>
      {/* Backdrop invisível para fechar */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={handleClose}
      />

      {/* Dropdown */}
      <div
        style={{
          position: 'absolute',
          top: pos.top,
          left: pos.left,
          width: pos.width,
          zIndex: 9999,
        }}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Busca */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
          {loading
            ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />
            : <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar setor..."
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 min-w-0"
          />
        </div>

        {/* Lista */}
        <div className="max-h-48 overflow-y-auto">
          {setores.length === 0 && !loading ? (
            <p className="text-xs text-slate-400 text-center py-4">
              {search ? `Nenhum resultado para "${search}"` : 'Nenhum setor cadastrado.'}
            </p>
          ) : (
            setores.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id, s.nome); handleClose() }}
                className={`
                  w-full text-left px-3 py-2.5 text-sm flex items-center gap-2
                  hover:bg-slate-50 dark:hover:bg-slate-700 transition
                  ${value === s.id
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'text-slate-700 dark:text-slate-200'
                  }
                `}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{s.nome}</span>
              </button>
            ))
          )}
        </div>

        {/* Criar novo */}
        {allowCreate && (
          <div className="border-t border-slate-100 dark:border-slate-700 p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
                placeholder="Criar novo setor..."
                className="flex-1 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!novoNome.trim() || creating}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition shrink-0"
              >
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  ) : null

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className={`
          flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700
          rounded-lg bg-white dark:bg-slate-800 transition
          ${disabled
            ? 'opacity-60 cursor-not-allowed'
            : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600'
          }
        `}
      >
        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        {value && selectedNome ? (
          <>
            <span className="flex-1 text-sm text-slate-800 dark:text-slate-200 truncate">
              {selectedNome}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null, null) }}
                className="text-slate-400 hover:text-slate-600 transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <span className="flex-1 text-sm text-slate-400 truncate">{placeholder}</span>
        )}
      </div>

      {dropdown}
    </div>
  )
}
