'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'
import {
  clearInspectContext,
  createInspectContext,
  getReturnContextForRoute,
  readInspectContext,
  writeInspectContext,
  type InspectContext,
} from '@/lib/navigation-context'

export function InspectContextReturn() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [context, setContext] = useState<InspectContext | null>(null)
  const searchString = searchParams.toString()

  useEffect(() => {
    const current = createInspectContext(pathname, searchString)
    const stored = readInspectContext(window.sessionStorage)
    const nextContext = getReturnContextForRoute(current, stored)

    if (current) {
      if (nextContext?.href !== current.href) {
        const timeout = window.setTimeout(() => setContext(nextContext), 0)
        return () => window.clearTimeout(timeout)
      }

      writeInspectContext(window.sessionStorage, current)
      const timeout = window.setTimeout(() => setContext(current), 0)
      return () => window.clearTimeout(timeout)
    }

    const timeout = window.setTimeout(() => {
      setContext(readInspectContext(window.sessionStorage))
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [pathname, searchString])

  const currentHref = `${pathname}${searchString ? `?${searchString}` : ''}`

  if (!context || context.href === currentHref) return null

  function handleReturn() {
    if (!context) return
    router.push(context.href)
  }

  function handleDismiss() {
    clearInspectContext(window.sessionStorage)
    setContext(null)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-950/15 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <button
        type="button"
        onClick={handleReturn}
        className="group flex h-11 items-center gap-2 rounded-full bg-blue-600 pl-3 pr-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={`Voltar para ${context.label}`}
        title={`Voltar para ${context.label}`}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Voltar para {context.label}</span>
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Ocultar retorno de contexto"
        title="Ocultar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
