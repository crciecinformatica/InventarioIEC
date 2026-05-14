'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type MouseEvent } from 'react'
import {
  Users, Monitor, Laptop, Smartphone,
  Printer, Phone, Server,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stats {
  colaboradores: number
  maquinas: number
  notebooks: number
  aparelhos: number
  impressoras: number
  ramais: number
  racks: number
  maquinasAlocadas: number
  notebooksAlocados: number
  aparelhosAlocados: number
  ramaisAlocados: number
}

interface CardConfig {
  label: string
  value: number
  icon: React.ElementType
  href: string
  iconColor: string
  iconBg: string
  accentColor: string        // cor da borda e do progress bar
  progressColor?: string
  alocados?: number          // quantos estão alocados
  showProgress?: boolean
}

function ProgressBar({ total, alocados, accentColor }: {
  total: number
  alocados: number
  accentColor: string
}) {
  const livres = Math.max(0, total - alocados)
  const pctAlocado = total > 0 ? Math.round((alocados / total) * 100) : 0

  return (
    <div className="mt-3 space-y-1.5">
      {/* Barra */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', accentColor)}
          style={{ width: `${pctAlocado}%` }}
        />
      </div>
      {/* Legenda */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>{alocados} alocado{alocados !== 1 ? 's' : ''}</span>
        <span>{livres} livre{livres !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

function getOccupancyIndicator(pct: number) {
  if (pct >= 90) {
    return {
      dotClassName: 'bg-red-500',
      textClassName: 'text-red-700 dark:text-red-200',
      wrapperClassName: 'bg-red-100 dark:bg-red-950/60 ring-red-200 dark:ring-red-900',
      label: `Ocupação alta: ${pct}%`,
    }
  }

  if (pct >= 50) {
    return {
      dotClassName: 'bg-amber-500',
      textClassName: 'text-amber-700 dark:text-amber-200',
      wrapperClassName: 'bg-amber-100 dark:bg-amber-950/60 ring-amber-200 dark:ring-amber-900',
      label: `Ocupação moderada: ${pct}%`,
    }
  }

  return {
    dotClassName: 'bg-emerald-500',
    textClassName: 'text-emerald-700 dark:text-emerald-200',
    wrapperClassName: 'bg-emerald-100 dark:bg-emerald-950/60 ring-emerald-200 dark:ring-emerald-900',
    label: `Ocupação baixa: ${pct}%`,
  }
}

function OccupancyIndicator({
  pct,
  indicator,
}: {
  pct: number
  indicator: ReturnType<typeof getOccupancyIndicator>
}) {
  return (
    <div
      className={cn(
        'absolute right-3 top-3 flex h-5 items-center gap-1.5 rounded-full px-2 text-[10px] font-bold tabular-nums ring-1',
        indicator.wrapperClassName,
        indicator.textClassName
      )}
      title={indicator.label}
      aria-label={indicator.label}
    >
      <span className={cn('h-2 w-2 rounded-full', indicator.dotClassName)} aria-hidden />
      <span>{pct}%</span>
    </div>
  )
}

export function StatsCards({ stats }: { stats: Stats }) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setPendingHref(null), 0)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  useEffect(() => {
    if (!pendingHref) return
    const timeout = window.setTimeout(() => setPendingHref(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [pendingHref])

  function handleCardClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (
      href === pathname ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return
    }

    setPendingHref(href)
  }

  const cards: CardConfig[] = [
    {
      label: 'Ramais',
      value: stats.ramais,
      icon: Phone,
      href: '/ramais',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950',
      accentColor: 'border-l-emerald-500',
      progressColor: 'bg-emerald-500',
      alocados: stats.ramaisAlocados,
      showProgress: true,
    },
    {
      label: 'Máquinas',
      value: stats.maquinas,
      icon: Monitor,
      href: '/maquinas',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950',
      accentColor: 'border-l-blue-500',
      progressColor: 'bg-blue-500',
      alocados: stats.maquinasAlocadas,
      showProgress: true,
    },
    {
      label: 'Notebooks',
      value: stats.notebooks,
      icon: Laptop,
      href: '/notebooks',
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-950',
      accentColor: 'border-l-violet-500',
      progressColor: 'bg-violet-500',
      alocados: stats.notebooksAlocados,
      showProgress: true,
    },
    {
      label: 'Aparelhos',
      value: stats.aparelhos,
      icon: Smartphone,
      href: '/aparelhos',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-50 dark:bg-cyan-950',
      accentColor: 'border-l-cyan-500',
      progressColor: 'bg-cyan-500',
      alocados: stats.aparelhosAlocados,
      showProgress: true,
    },
    {
      label: 'Colaboradores Ativos',
      value: stats.colaboradores,
      icon: Users,
      href: '/colaboradores',
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-50 dark:bg-sky-950',
      accentColor: 'border-l-sky-500',
      showProgress: false,
    },
    {
      label: 'Impressoras',
      value: stats.impressoras,
      icon: Printer,
      href: '/impressoras',
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-50 dark:bg-teal-950',
      accentColor: 'border-l-teal-500',
      showProgress: false,
    },
    {
      label: 'Racks',
      value: stats.racks,
      icon: Server,
      href: '/racks',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950',
      accentColor: 'border-l-amber-500',
      showProgress: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((card) => (
        (() => {
          const pctAlocado = card.showProgress && card.alocados !== undefined && card.value > 0
            ? Math.round((card.alocados / card.value) * 100)
            : 0
          const occupancy = getOccupancyIndicator(pctAlocado)
          const pending = pendingHref === card.href

          return (
            <Link
              key={card.label}
              href={card.href}
              aria-busy={pending}
              onClick={(event) => handleCardClick(event, card.href)}
              className={cn(
                'group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-l-2 rounded-xl p-4',
                'hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-150',
                pending && 'cursor-wait border-blue-200 dark:border-blue-800 shadow-sm',
                card.accentColor,
                // Cards com progress bar têm altura um pouco maior — manter alinhamento
                card.showProgress ? 'flex flex-col justify-between' : ''
              )}
            >
          {card.showProgress && card.value > 0 && (
            <OccupancyIndicator pct={pctAlocado} indicator={occupancy} />
          )}
          <div>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', card.iconBg)}>
              {pending
                ? <Loader2 className={cn('w-4 h-4 animate-spin', card.iconColor)} />
                : <card.icon className={cn('w-4 h-4', card.iconColor)} />
              }
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none mb-1">
              {card.value.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{card.label}</p>
            {pending && (
              <p className="mt-1 text-[10px] font-medium text-blue-500 dark:text-blue-400">
                Abrindo...
              </p>
            )}
          </div>

          {card.showProgress && card.alocados !== undefined && card.value > 0 && (
            <ProgressBar
              total={card.value}
              alocados={card.alocados}
              accentColor={card.progressColor ?? 'bg-blue-500'}
            />
          )}
        </Link>
          )
        })()
      ))}
    </div>
  )
}
