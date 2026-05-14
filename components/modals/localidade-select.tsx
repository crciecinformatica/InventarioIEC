'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, MapPin, Search, X } from 'lucide-react'

interface LocalidadeOption {
  id: string
  nome: string
  ativo: boolean
}

interface Props {
  value: string | null
  onChange: (id: string | null, nome: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface DropdownPos {
  top: number
  left: number
  width: number
}

export function LocalidadeSelect({
  value,
  onChange,
  placeholder = 'Selecionar localidade...',
  disabled = false,
  className = '',
}: Props) {
  const [localidades, setLocalidades] = useState<LocalidadeOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<DropdownPos | null>(null)

  const triggerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedNome = value
    ? localidades.find(localidade => localidade.id === value)?.nome ?? null
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

  useEffect(() => {
    if (!open && !value) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ ativo: 'true' })
        if (search) params.set('search', search)
        const res = await fetch(`/api/localidades?${params}`)
        const json = await res.json()
        setLocalidades(Array.isArray(json) ? json : [])
      } catch {
        setLocalidades([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, open, value])

  function handleClose() {
    setOpen(false)
    setSearch('')
  }

  const dropdown = open && pos && typeof document !== 'undefined' ? createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={handleClose}
      />
      <div
        style={{
          position: 'absolute',
          top: pos.top,
          left: pos.left,
          width: pos.width,
          zIndex: 9999,
        }}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-700">
          {loading
            ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
            : <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          }
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar localidade..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {localidades.length === 0 && !loading ? (
            <p className="py-4 text-center text-xs text-slate-400">
              {search ? `Nenhum resultado para "${search}"` : 'Nenhuma localidade cadastrada.'}
            </p>
          ) : (
            localidades.map(localidade => (
              <button
                key={localidade.id}
                type="button"
                onClick={() => { onChange(localidade.id, localidade.nome); handleClose() }}
                className={`
                  flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition
                  hover:bg-slate-50 dark:hover:bg-slate-700
                  ${value === localidade.id
                    ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-200'
                  }
                `}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{localidade.nome}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null

  return (
    <div className={`relative ${className}`}>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className={`
          flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 transition
          dark:border-slate-700 dark:bg-slate-800
          ${disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600'
          }
        `}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        {value && selectedNome ? (
          <>
            <span className="flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
              {selectedNome}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); onChange(null, null) }}
                className="shrink-0 text-slate-400 transition hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <span className="flex-1 truncate text-sm text-slate-400">{placeholder}</span>
        )}
      </div>
      {dropdown}
    </div>
  )
}
