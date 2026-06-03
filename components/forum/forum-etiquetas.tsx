'use client'

import { AnimatePresence, motion } from 'motion/react'
import { FORUM_ETIQUETA_CONFIG, FORUM_ETIQUETAS, type ForumEtiqueta } from '@/lib/forum'
import { X } from 'lucide-react'

type EtiquetaInput = ForumEtiqueta | { etiqueta: ForumEtiqueta | string }

function normalize(etiquetas?: EtiquetaInput[] | null): ForumEtiqueta[] {
  if (!Array.isArray(etiquetas)) return []
  return etiquetas
    .map(item => typeof item === 'string' ? item : item.etiqueta)
    .filter((item): item is ForumEtiqueta => FORUM_ETIQUETAS.includes(item as ForumEtiqueta))
}

export function ForumEtiquetaBadges({ etiquetas, compact = false }: { etiquetas?: EtiquetaInput[] | null; compact?: boolean }) {
  const normalized = normalize(etiquetas)
  if (normalized.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {normalized.map(etiqueta => {
        const cfg = FORUM_ETIQUETA_CONFIG[etiqueta]
        const Icon = cfg.icon
        return (
          <span
            key={etiqueta}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}
          >
            <Icon className="h-3 w-3" />
            {!compact && cfg.label}
          </span>
        )
      })}
    </div>
  )
}

export function ForumEtiquetaSelect({
  value,
  onChange,
}: {
  value: ForumEtiqueta[]
  onChange: (value: ForumEtiqueta[]) => void
}) {
  function toggle(etiqueta: ForumEtiqueta) {
    if (value.includes(etiqueta)) {
      onChange(value.filter(item => item !== etiqueta))
      return
    }
    onChange([...value, etiqueta])
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pipeline e etiquetas</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Marque como o registro deve aparecer no fluxo do fórum.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {FORUM_ETIQUETAS.map(etiqueta => {
          const selected = value.includes(etiqueta)
          const cfg = FORUM_ETIQUETA_CONFIG[etiqueta]
          const Icon = cfg.icon
          return (
            <button
              key={etiqueta}
              type="button"
              onClick={() => toggle(etiqueta)}
              className={`group flex min-h-16 items-start gap-3 rounded-xl border p-3 text-left transition ${
                selected
                  ? 'border-blue-500/70 bg-blue-950/30 text-white shadow-[0_0_0_1px_rgba(59,130,246,.25)]'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <span className={`mt-0.5 rounded-lg border p-1.5 ${selected ? cfg.badge : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{cfg.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500 group-hover:text-slate-400">{cfg.description}</span>
              </span>
            </button>
          )
        })}
      </div>
      <AnimatePresence initial={false}>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-wrap gap-2"
          >
            {value.map(etiqueta => {
              const cfg = FORUM_ETIQUETA_CONFIG[etiqueta]
              return (
                <button
                  key={etiqueta}
                  type="button"
                  onClick={() => toggle(etiqueta)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}
                >
                  {cfg.label}
                  <X className="h-3 w-3" />
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
