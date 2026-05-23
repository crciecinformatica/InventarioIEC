'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronUp, History, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  clearInspectHistory,
  consumePendingInspectPreview,
  createInspectContext,
  getInspectPreviewFromContext,
  getReturnOptions,
  readInspectHistory,
  updateInspectHistory,
  writePendingInspectPreview,
  writeInspectHistory,
  type InspectContext,
} from '@/lib/navigation-context'
import { AnimatedFloat } from '@/components/layout/motion-primitives'

const BASE_BOTTOM_OFFSET = 20
const SIDE_SHEET_BOTTOM_OFFSET = 96
const FLOATING_STACK_GAP = 12
const RETURN_CONTROL_FALLBACK_HEIGHT = 64

function getBottomRightOccupiedOffset(minBottom: number) {
  if (typeof window === 'undefined') return minBottom

  const sheetFooterRects = Array.from(document.querySelectorAll<HTMLElement>('[data-animated-sheet-frame] > div:last-child'))
    .map(element => element.getBoundingClientRect())
    .filter(rect => (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right >= window.innerWidth - 24 &&
      rect.bottom >= window.innerHeight - 24
    ))

  if (sheetFooterRects.length === 0) return minBottom

  const highestOccupiedTop = Math.min(...sheetFooterRects.map(rect => rect.top))
  return Math.max(minBottom, window.innerHeight - highestOccupiedTop + FLOATING_STACK_GAP)
}

function useFloatingStackBottom(minBottom: number) {
  const [bottomOffset, setBottomOffset] = useState(minBottom)

  useEffect(() => {
    let frame = 0
    const timeouts: number[] = []

    function clearScheduledTimeouts() {
      while (timeouts.length > 0) {
        const timeout = timeouts.pop()
        if (timeout) window.clearTimeout(timeout)
      }
    }

    function readOffset() {
      setBottomOffset(getBottomRightOccupiedOffset(minBottom))
    }

    function scheduleRead(delay = 0) {
      if (delay > 0) {
        const timeout = window.setTimeout(readOffset, delay)
        timeouts.push(timeout)
        return
      }

      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(readOffset)
      })
    }

    function update() {
      clearScheduledTimeouts()
      scheduleRead()
      scheduleRead(80)
      scheduleRead(180)
      scheduleRead(320)
    }

    update()

    const observer = new MutationObserver(update)
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style', 'data-mounted', 'data-removed'],
    })

    window.addEventListener('resize', update)

    return () => {
      window.cancelAnimationFrame(frame)
      clearScheduledTimeouts()
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [minBottom])

  return bottomOffset
}

export function InspectContextReturn() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const returnRef = useRef<HTMLDivElement | null>(null)
  const [history, setHistory] = useState<InspectContext[]>([])
  const [open, setOpen] = useState(false)
  const searchString = searchParams.toString()
  const currentHref = `${pathname}${searchString ? `?${searchString}` : ''}`
  const sideSheetOpen = (
    searchParams.has('inspect') &&
    (pathname === '/colaboradores' || pathname === '/impressoras' || pathname === '/racks' || pathname === '/movimentacoes')
  )
  const minBottomOffset = sideSheetOpen ? SIDE_SHEET_BOTTOM_OFFSET : BASE_BOTTOM_OFFSET
  const bottomOffset = useFloatingStackBottom(minBottomOffset)

  useEffect(() => {
    const href = `${pathname}${searchString ? `?${searchString}` : ''}`
    const preview = consumePendingInspectPreview(window.sessionStorage, href)
    const current = createInspectContext(pathname, searchString, Date.now(), preview)
    const storedHistory = readInspectHistory(window.sessionStorage)

    if (current) {
      const nextHistory = updateInspectHistory(storedHistory, current)
      writeInspectHistory(window.sessionStorage, nextHistory)
      const timeout = window.setTimeout(() => setHistory(nextHistory), 0)
      return () => window.clearTimeout(timeout)
    }

    const timeout = window.setTimeout(() => {
      setHistory(readInspectHistory(window.sessionStorage))
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [pathname, searchString])

  const options = getReturnOptions(history, currentHref)
  const visible = options.length > 0
  const primary = options[0]

  useEffect(() => {
    if (!visible) {
      document.documentElement.style.removeProperty('--crc-sonner-bottom')
      return
    }

    function updateSonnerStackReserve() {
      const height = returnRef.current?.getBoundingClientRect().height || RETURN_CONTROL_FALLBACK_HEIGHT
      document.documentElement.style.setProperty(
        '--crc-sonner-bottom',
        `${bottomOffset + height + FLOATING_STACK_GAP}px`,
      )
    }

    updateSonnerStackReserve()

    const observer = new ResizeObserver(updateSonnerStackReserve)
    if (returnRef.current) observer.observe(returnRef.current)
    window.addEventListener('resize', updateSonnerStackReserve)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSonnerStackReserve)
      document.documentElement.style.removeProperty('--crc-sonner-bottom')
    }
  }, [bottomOffset, visible])

  function handleReturn(context: InspectContext) {
    setOpen(false)
    writePendingInspectPreview(window.sessionStorage, context.href, getInspectPreviewFromContext(context))
    router.push(context.href)
  }

  function handleDismiss() {
    clearInspectHistory(window.sessionStorage)
    setHistory([])
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {visible && primary && (
        <AnimatedFloat
          className="fixed right-5 z-50 w-[min(320px,calc(100vw-2rem))] rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-950/15 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
          ref={returnRef}
          style={{ bottom: bottomOffset }}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                className="absolute bottom-[calc(100%+0.5rem)] right-0 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-950/15 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.16 }}
              >
                <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <History className="h-3.5 w-3.5" />
                  Histórico recente
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-950/60">
                  {options.map(item => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleReturn(item)}
                      className="w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-slate-900"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {item.label}{item.subtitle ? ` · ${item.subtitle}` : ''}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleReturn(primary)}
              className="group flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-blue-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
              aria-label={`Voltar para ${primary.title}`}
              title={`Voltar para ${primary.title}`}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">
                <span className="block truncate leading-4">Voltar</span>
                <span className="block truncate text-[11px] font-semibold leading-3 text-blue-100">{primary.title}</span>
              </span>
            </button>
            {options.length > 1 && (
              <button
                type="button"
                onClick={() => setOpen(value => !value)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-expanded={open}
                aria-label="Abrir histórico de navegação"
                title="Histórico"
              >
                <ChevronUp className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
              </button>
            )}
          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Ocultar retorno de contexto"
            title="Ocultar"
          >
            <X className="h-4 w-4" />
          </button>
          </div>
        </AnimatedFloat>
      )}
    </AnimatePresence>
  )
}
