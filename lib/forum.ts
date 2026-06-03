import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Monitor,
  Laptop,
  Megaphone,
  NotebookText,
  Phone,
  Printer,
  Server,
  Smartphone,
  Wrench,
} from 'lucide-react'
import type { ElementType } from 'react'

export const FORUM_ETIQUETAS = ['comentario', 'tutorial', 'trativa', 'solucao', 'incidente', 'aviso'] as const
export type ForumEtiqueta = typeof FORUM_ETIQUETAS[number]

export const FORUM_ETIQUETA_CONFIG: Record<ForumEtiqueta, {
  label: string
  description: string
  icon: ElementType
  badge: string
  accent: string
}> = {
  comentario: {
    label: 'Comentário',
    description: 'Registro livre ou observação do setor',
    icon: MessageSquare,
    badge: 'bg-slate-800 text-slate-200 border-slate-600',
    accent: 'from-slate-500/30 to-slate-900/20',
  },
  tutorial: {
    label: 'Tutorial',
    description: 'Passo a passo de funcionamento',
    icon: NotebookText,
    badge: 'bg-violet-950/80 text-violet-200 border-violet-700/70',
    accent: 'from-violet-500/30 to-violet-950/20',
  },
  trativa: {
    label: 'Trativa',
    description: 'Acompanhamento operacional',
    icon: Wrench,
    badge: 'bg-blue-950/80 text-blue-200 border-blue-700/70',
    accent: 'from-blue-500/30 to-blue-950/20',
  },
  solucao: {
    label: 'Solução',
    description: 'Correção validada ou caminho recomendado',
    icon: CheckCircle2,
    badge: 'bg-emerald-950/80 text-emerald-200 border-emerald-700/70',
    accent: 'from-emerald-500/30 to-emerald-950/20',
  },
  incidente: {
    label: 'Incidente',
    description: 'Falha, bloqueio ou risco em andamento',
    icon: AlertTriangle,
    badge: 'bg-amber-950/80 text-amber-200 border-amber-700/70',
    accent: 'from-amber-500/30 to-amber-950/20',
  },
  aviso: {
    label: 'Aviso',
    description: 'Comunicado importante para consulta',
    icon: Megaphone,
    badge: 'bg-cyan-950/80 text-cyan-200 border-cyan-700/70',
    accent: 'from-cyan-500/30 to-cyan-950/20',
  },
}

export type ForumTipoItem = 'maquinas' | 'notebooks' | 'aparelhos' | 'impressoras' | 'ramais' | 'racks'

export const FORUM_TIPO_ITEM_CONFIG: Record<ForumTipoItem, {
  label: string
  singular: string
  icon: ElementType
  href: string
  chip: string
}> = {
  maquinas: {
    label: 'Máquinas',
    singular: 'Máquina',
    icon: Monitor,
    href: '/maquinas',
    chip: 'bg-violet-950/70 text-violet-200 border-violet-700/60',
  },
  notebooks: {
    label: 'Notebooks',
    singular: 'Notebook',
    icon: Laptop,
    href: '/notebooks',
    chip: 'bg-indigo-950/70 text-indigo-200 border-indigo-700/60',
  },
  aparelhos: {
    label: 'Aparelhos',
    singular: 'Aparelho',
    icon: Smartphone,
    href: '/aparelhos',
    chip: 'bg-cyan-950/70 text-cyan-200 border-cyan-700/60',
  },
  impressoras: {
    label: 'Impressoras',
    singular: 'Impressora',
    icon: Printer,
    href: '/impressoras',
    chip: 'bg-amber-950/70 text-amber-200 border-amber-700/60',
  },
  ramais: {
    label: 'Ramais',
    singular: 'Ramal',
    icon: Phone,
    href: '/ramais',
    chip: 'bg-emerald-950/70 text-emerald-200 border-emerald-700/60',
  },
  racks: {
    label: 'Racks',
    singular: 'Rack',
    icon: Server,
    href: '/racks',
    chip: 'bg-slate-800 text-slate-200 border-slate-600',
  },
}

export function sanitizeForumEtiquetas(value: unknown): ForumEtiqueta[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set<string>(FORUM_ETIQUETAS)
  return Array.from(new Set(value.filter((item): item is ForumEtiqueta =>
    typeof item === 'string' && allowed.has(item)
  )))
}

export function normalizeForumEtiquetas(value: unknown) {
  const etiquetas = sanitizeForumEtiquetas(value)
  return etiquetas.length > 0 ? etiquetas : ['comentario' satisfies ForumEtiqueta]
}
