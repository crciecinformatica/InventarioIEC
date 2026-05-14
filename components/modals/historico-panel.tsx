'use client'

import { useEffect, useState } from 'react'
import { History, ChevronDown, ChevronUp, Loader2, User, Edit, Plus, Trash2, Link, Unlink } from 'lucide-react'

interface AuditEntry {
  id: string
  acao: string
  descricao: string | null
  usuario_nome: string | null
  created_at: string | null
  dados_anteriores: unknown
  dados_novos: unknown
}

const ACAO_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CREATE:          { label: 'Criação',             color: 'bg-green-500',  icon: Plus     },
  UPDATE:          { label: 'Edição',              color: 'bg-blue-500',   icon: Edit     },
  DELETE:          { label: 'Exclusão',            color: 'bg-red-500',    icon: Trash2   },
  ALOCAR:          { label: 'Alocação',            color: 'bg-violet-500', icon: Link     },
  DESALOCAR:       { label: 'Desalocação',         color: 'bg-orange-500', icon: Unlink   },
  EDITAR_ALOCACAO: { label: 'Edição de Alocação',  color: 'bg-amber-500',  icon: Edit     },
}

interface Props {
  registroId: string
  tabela: string
}

export function HistoricoPanel({ registroId, tabela }: Props) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!open || loaded) return
    const loadingTimer = window.setTimeout(() => setLoading(true), 0)

    fetch(`/api/audit-log/${registroId}?tabela=${tabela}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const json = await r.json()
        setLogs(Array.isArray(json) ? json : [])
        setLoaded(true)
      })
      .catch((err) => {
        console.error('[HistoricoPanel]', err)
        setLogs([])
      })
      .finally(() => setLoading(false))

    return () => window.clearTimeout(loadingTimer)
  }, [open, loaded, registroId, tabela])

  const config = (acao: string) => ACAO_CONFIG[acao] ?? { label: acao, color: 'bg-slate-400', icon: History }

  function formatDateTime(dt: string | null) {
    if (!dt) return '—'
    const d = new Date(dt)
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden mt-4">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Histórico de alterações
          </span>
          {loaded && logs.length > 0 && (
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {logs.length}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="divide-y divide-slate-50 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <History className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Nenhuma alteração registrada.</p>
            </div>
          ) : (
            logs.map((log, index) => {
              const cfg = config(log.acao)
              const Icon = cfg.icon
              const isLast = index === logs.length - 1

              return (
                <div key={log.id} className="flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <div className={`w-6 h-6 rounded-full ${cfg.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-slate-100 dark:bg-slate-800 min-h-[8px]" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {cfg.label}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>

                    {log.descricao && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words leading-relaxed">
                        {log.descricao}
                      </p>
                    )}

                    {log.usuario_nome && (
                      <div className="flex items-center gap-1 mt-1">
                        <User className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {log.usuario_nome}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
