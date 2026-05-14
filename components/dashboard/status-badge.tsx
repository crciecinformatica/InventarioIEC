import { cn } from '@/lib/utils'
import {
  mapStatusSolicitacao,
  mapPrioridade,
  STATUS_SOLICITACAO_MAP,
  PRIORIDADE_MAP,
} from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap', className)}>
      {children}
    </span>
  )
}

// Status como Int (1=Aberto, 2=Em andamento, 3=Pendente, 4=Concluído, 5=Cancelado)
export function StatusSolicitacaoBadge({ status }: { status: number | string | null | undefined }) {
  if (status === null || status === undefined) return <span className="text-slate-400 text-xs">—</span>
  const n = typeof status === 'string' ? parseInt(status) : status
  const label = STATUS_SOLICITACAO_MAP[n] || `Status ${status}`

  const colorMap: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    2: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    3: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    4: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    5: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }

  return <Badge className={colorMap[n] || 'bg-slate-100 text-slate-600'}>{label}</Badge>
}

// Retrocompatibilidade: aceita string ou número
export function StatusBadge({ status }: { status: string | number | null | undefined }) {
  if (status === null || status === undefined) return <span className="text-slate-400 text-xs">—</span>
  // Se for número, usa mapa de solicitações
  if (typeof status === 'number' || !isNaN(Number(status))) {
    return <StatusSolicitacaoBadge status={status} />
  }
  // String (Ativo/Inativo)
  const s = String(status).toLowerCase()
  const map: Record<string, string> = {
    'ativo': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    'inativo': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return <Badge className={map[s] || 'bg-slate-100 text-slate-600'}>{status}</Badge>
}

// Prioridade como Int (1=Baixa, 2=Média, 3=Alta, 4=Crítica, 5=Urgente)
export function PrioridadeBadge({ prioridade }: { prioridade: number | string | null | undefined }) {
  if (prioridade === null || prioridade === undefined) return <span className="text-slate-400 text-xs">—</span>
  const n = typeof prioridade === 'string' ? parseInt(prioridade) : prioridade
  const label = PRIORIDADE_MAP[n] || `P${prioridade}`

  const colorMap: Record<number, string> = {
    1: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    2: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    3: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    4: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    5: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return <Badge className={colorMap[n] || 'bg-slate-100 text-slate-600'}>{label}</Badge>
}

export function CategoriaBadge({ categoria }: { categoria: string | null | undefined }) {
  if (!categoria) return <span className="text-slate-400 text-xs">—</span>
  const className =
    categoria === 'Administrativa'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      : categoria === 'Backup'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'

  return (
    <Badge className={className}>
      {categoria === 'Academica' ? 'Acadêmica' : categoria}
    </Badge>
  )
}

export function BoolBadge({
  value,
  labelTrue = 'Sim',
  labelFalse = 'Não',
}: { value: boolean | null | undefined; labelTrue?: string; labelFalse?: string }) {
  if (value === null || value === undefined) return <span className="text-slate-400 text-xs">—</span>
  return (
    <Badge className={value
      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    }>
      {value ? labelTrue : labelFalse}
    </Badge>
  )
}
