'use client'

import { useEffect, useState } from 'react'
import {
  Monitor,
  Laptop,
  Smartphone,
  Phone,
  ChevronRight,
  CalendarDays,
  Hash,
  MapPin,
  MessageCircle,
  PackageOpen,
  Wifi,
  ListTree,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { AdicionarAlocacaoForm } from '@/components/modals/adicionar-alocacao-form'

type AlocacaoItemData = {
  id: string
} & Record<string, string | number | boolean | null | undefined>

interface AlocacaoItem {
  alocacao_id: string
  data_inicio: string | Date | null
  item: AlocacaoItemData
  tipo_uso?: number | null
  motivo_alocacao?: string | null
  whatsapp?: boolean | null
}

interface AlocacoesData {
  maquinas:  AlocacaoItem[]
  notebooks: AlocacaoItem[]
  aparelhos: AlocacaoItem[]
  ramais:    AlocacaoItem[]
}

interface Props {
  colaboradorId: string
  onNavigate?: (
    tipo: 'maquinas' | 'notebooks' | 'aparelhos' | 'ramais',
    itemId: string,
    preview?: { title: string; subtitle?: string }
  ) => void
  interactive?: boolean
  variant?: 'full' | 'summary'
}

const TIPO_CONFIG = {
  maquinas: {
    label: 'Máquinas',
    singular: 'Máquina',
    icon: Monitor,
    color: 'text-blue-600 dark:text-blue-400',
    bg:    'bg-blue-50 dark:bg-blue-950/30',
    border:'border-blue-100 dark:border-blue-900/70',
    ring:  'ring-blue-100 dark:ring-blue-900/60',
    accent:'bg-blue-500',
    href:  '/maquinas',
  },
  notebooks: {
    label: 'Notebooks',
    singular: 'Notebook',
    icon: Laptop,
    color: 'text-violet-600 dark:text-violet-400',
    bg:    'bg-violet-50 dark:bg-violet-950/30',
    border:'border-violet-100 dark:border-violet-900/70',
    ring:  'ring-violet-100 dark:ring-violet-900/60',
    accent:'bg-violet-500',
    href:  '/notebooks',
  },
  aparelhos: {
    label: 'Aparelhos',
    singular: 'Aparelho',
    icon: Smartphone,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg:    'bg-cyan-50 dark:bg-cyan-950/30',
    border:'border-cyan-100 dark:border-cyan-900/70',
    ring:  'ring-cyan-100 dark:ring-cyan-900/60',
    accent:'bg-cyan-500',
    href:  '/aparelhos',
  },
  ramais: {
    label: 'Ramais',
    singular: 'Ramal',
    icon: Phone,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg:    'bg-emerald-50 dark:bg-emerald-950/30',
    border:'border-emerald-100 dark:border-emerald-900/70',
    ring:  'ring-emerald-100 dark:ring-emerald-900/60',
    accent:'bg-emerald-500',
    href:  '/ramais',
  },
} as const

function getItemLabel(tipo: keyof typeof TIPO_CONFIG, item: AlocacaoItemData): string {
  switch (tipo) {
    case 'maquinas':
      return String(item.nome_host ?? item.identificador ?? '—')
    case 'notebooks':
      return String(item.numero_patrimonio ?? item.modelo ?? '—')
    case 'aparelhos':
      return String(item.modelo ?? '—')
    case 'ramais':
      return item.numero_ramal != null ? `Ramal ${item.numero_ramal}` : '—'
  }
}

function getStringField(item: AlocacaoItemData, key: string) {
  const value = item[key]
  return value == null ? '' : String(value)
}

function getItemSub(tipo: keyof typeof TIPO_CONFIG, item: AlocacaoItemData): string {
  const setor = getStringField(item, 'setor_nome')
  switch (tipo) {
    case 'maquinas':
      return [item.fabricante, item.modelo].filter(Boolean).map(String).join(' ') || setor
    case 'notebooks':
      return [item.fabricante, item.modelo].filter(Boolean).map(String).join(' ') || ''
    case 'aparelhos':
      return ''
    case 'ramais':
      return ''
  }
}

function getItemCode(tipo: keyof typeof TIPO_CONFIG, item: AlocacaoItemData): string {
  switch (tipo) {
    case 'maquinas':
      return String(item.patrimonio_cpu ?? '')
    case 'notebooks':
      return String(item.numero_patrimonio ?? '')
    case 'aparelhos':
      return String(item.endereco_ip ?? '')
    case 'ramais':
      return String(item.prefixo_telefonico ?? '')
  }
}

function getItemLocation(tipo: keyof typeof TIPO_CONFIG, item: AlocacaoItemData): string {
  switch (tipo) {
    case 'maquinas':
    case 'notebooks':
    case 'aparelhos':
      return getStringField(item, 'setor_nome') || getStringField(item, 'localidade_nome')
    case 'ramais':
      return getStringField(item, 'setor_nome') || String(item.disponibilidade ?? '')
  }
}

function getCategoryLabel(value: AlocacaoItemData['categoria']) {
  if (value === 'Academica') return 'Acadêmica'
  if (value === 'Administrativa') return 'Administrativa'
  return ''
}

function SummaryTile({
  tipo,
  count,
}: {
  tipo: keyof typeof TIPO_CONFIG
  count: number
}) {
  const cfg = TIPO_CONFIG[tipo]
  const Icon = cfg.icon

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2`}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-white/80 dark:bg-slate-900/80 flex items-center justify-center shadow-sm">
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-900 dark:text-white leading-none">{count}</p>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {cfg.label}
          </p>
        </div>
      </div>
    </div>
  )
}

function MetadataBadge({
  icon: Icon,
  children,
}: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-slate-900/60 px-1.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/70 dark:ring-slate-800">
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}

function AlocacaoCard({
  tipo,
  aloc,
  onNavigate,
  interactive,
}: {
  tipo: keyof typeof TIPO_CONFIG
  aloc: AlocacaoItem
  onNavigate: Props['onNavigate']
  interactive: boolean
}) {
  const cfg = TIPO_CONFIG[tipo]
  const Icon = cfg.icon
  const label = getItemLabel(tipo, aloc.item)
  const sub   = getItemSub(tipo, aloc.item)
  const code = getItemCode(tipo, aloc.item)
  const location = getItemLocation(tipo, aloc.item)
  const category = tipo === 'maquinas' ? getCategoryLabel(aloc.item.categoria) : ''

  const content = (
    <>
      <div className="flex">
        <div className={`w-1 shrink-0 ${cfg.accent}`} />
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm ring-1 ${cfg.ring}`}>
              <Icon className={`w-5 h-5 ${cfg.color}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {label}
                  </p>
                  {sub && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{sub}</p>
                  )}
                </div>
                {interactive && (
                  <ChevronRight className={`w-4 h-4 ${cfg.color} opacity-50 group-hover:opacity-100 transition shrink-0 mt-0.5`} />
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {aloc.data_inicio && (
                  <MetadataBadge icon={CalendarDays}>Desde {formatDate(aloc.data_inicio)}</MetadataBadge>
                )}
                {code && <MetadataBadge icon={Hash}>{code}</MetadataBadge>}
                {location && <MetadataBadge icon={MapPin}>{location}</MetadataBadge>}
                {category && <MetadataBadge icon={Monitor}>{category}</MetadataBadge>}
                {tipo === 'aparelhos' && aloc.item.chip === true && (
                  <MetadataBadge icon={Smartphone}>Chip</MetadataBadge>
                )}
                {tipo === 'aparelhos' && aloc.item.endereco_mac && (
                  <MetadataBadge icon={Wifi}>MAC {String(aloc.item.endereco_mac)}</MetadataBadge>
                )}
                {tipo === 'ramais' && aloc.item.disponibilidade && (
                  <MetadataBadge icon={Phone}>{String(aloc.item.disponibilidade)}</MetadataBadge>
                )}
                {tipo === 'ramais' && aloc.item.fila === true && (
                  <MetadataBadge icon={ListTree}>Fila</MetadataBadge>
                )}
                {tipo === 'ramais' && aloc.whatsapp && (
                  <MetadataBadge icon={MessageCircle}>WhatsApp</MetadataBadge>
                )}
              </div>

              {(tipo === 'notebooks' || tipo === 'aparelhos') && aloc.motivo_alocacao && (
                <p className="mt-2 rounded-md bg-white/60 dark:bg-slate-900/50 px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {aloc.motivo_alocacao}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const className = `
    w-full text-left rounded-lg border ${cfg.border} ${cfg.bg}
    overflow-hidden transition-all group
    ${interactive ? 'hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40' : ''}
  `

  if (!interactive || !onNavigate) {
    return <div className={className}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={() => onNavigate(tipo, aloc.item.id, { title: label, subtitle: sub || location || undefined })}
      className={className}
    >
      {content}
    </button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-3 w-44 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="flex gap-1.5">
                <div className="h-6 w-20 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-6 w-16 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ColaboradorAlocacoes({
  colaboradorId,
  onNavigate,
  interactive = true,
  variant = 'full',
}: Props) {
  const [data, setData] = useState<AlocacoesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) setLoading(true)
    }, 0)

    fetch(`/api/colaboradores/${colaboradorId}/alocacoes`)
      .then(r => r.json())
      .then(json => {
        if (!cancelled) setData(json)
      })
      .catch(err => console.error('[ColaboradorAlocacoes]', err))
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      window.clearTimeout(loadingTimer)
    }
  }, [colaboradorId, refreshKey])

  const total = data
    ? data.maquinas.length + data.notebooks.length + data.aparelhos.length + data.ramais.length
    : 0

  if (loading) {
    return <LoadingSkeleton />
  }

  if (total === 0) {
    return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-5 py-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <PackageOpen className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhum dispositivo alocado</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          As alocações ativas deste colaborador aparecerão aqui.
        </p>
      </div>
      <AdicionarAlocacaoForm
        colaboradorId={colaboradorId}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />
    </div>
  )
  }

  const tipos = (['maquinas', 'notebooks', 'aparelhos', 'ramais'] as const).filter(
    t => data![t].length > 0
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['maquinas', 'notebooks', 'aparelhos', 'ramais'] as const).map(tipo => (
          <SummaryTile key={tipo} tipo={tipo} count={data![tipo].length} />
        ))}
      </div>

      {variant === 'full' && (
        <>
          {tipos.map(tipo => (
            <div key={tipo}>
              <div className="flex items-center gap-2 mb-2 pt-1">
                {(() => {
                  const Icon = TIPO_CONFIG[tipo].icon
                  return <Icon className={`w-3.5 h-3.5 ${TIPO_CONFIG[tipo].color}`} />
                })()}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {TIPO_CONFIG[tipo].label}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {data![tipo].length}
                </span>
              </div>
              <div className="space-y-2">
                {data![tipo].map(aloc => (
                  <AlocacaoCard
                    key={aloc.alocacao_id}
                    tipo={tipo}
                    aloc={aloc}
                    onNavigate={onNavigate}
                    interactive={interactive}
                  />
                ))}
              </div>
            </div>
          ))}
          <AdicionarAlocacaoForm
            colaboradorId={colaboradorId}
            onSuccess={() => setRefreshKey(k => k + 1)}
          />
        </>
      )}
    </div>
  )
}
