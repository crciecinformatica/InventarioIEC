'use client'

import { X, User, Clock, Database, Tag, FileText, ArrowRight } from 'lucide-react'
import type { AuditLog } from '@/lib/audit-constants'
import { ACAO_COLORS, ACAO_LABELS, TABELAS_OPCOES } from '@/lib/audit-constants'

interface Props {
  log: AuditLog
  onClose: () => void
}

function formatDateTime(dt: string | null) {
  if (!dt) return '—'
  const d = new Date(dt)
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}

function JsonDiff({ anterior, novo }: { anterior: any; novo: any }) {
  if (!anterior && !novo) return <p className="text-xs text-slate-400">Sem dados disponíveis.</p>

  // Coletar todas as chaves
  const camposIgnorados = new Set(['created_at', 'updated_at'])
  const todasChaves = Array.from(
    new Set([
      ...Object.keys(anterior || {}),
      ...Object.keys(novo || {}),
    ])
  ).filter(k => !camposIgnorados.has(k))

  if (todasChaves.length === 0) return <p className="text-xs text-slate-400">Nenhum campo para exibir.</p>

  const formatVal = (v: any): string => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  const linhasAlteradas = todasChaves.filter(k => {
    const a = formatVal((anterior || {})[k])
    const n = formatVal((novo || {})[k])
    return a !== n
  })

  const linhasIguais = todasChaves.filter(k => !linhasAlteradas.includes(k))

  return (
    <div className="space-y-1 text-xs font-mono">
      {/* Linhas alteradas primeiro */}
      {linhasAlteradas.map(key => {
        const valAnterior = formatVal((anterior || {})[key])
        const valNovo = formatVal((novo || {})[key])
        return (
          <div key={key} className="rounded-md overflow-hidden border border-blue-100 dark:border-blue-900">
            <div className="bg-blue-50 dark:bg-blue-950/40 px-3 py-1 font-semibold text-blue-700 dark:text-blue-400 text-[11px] uppercase tracking-wide">
              {key}
            </div>
            {anterior && (
              <div className="flex items-start gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30">
                <span className="text-red-400 shrink-0 mt-0.5">−</span>
                <span className="text-red-700 dark:text-red-400 break-all">{valAnterior}</span>
              </div>
            )}
            {novo && (
              <div className="flex items-start gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30">
                <span className="text-green-500 shrink-0 mt-0.5">+</span>
                <span className="text-green-700 dark:text-green-400 break-all">{valNovo}</span>
              </div>
            )}
          </div>
        )
      })}

      {/* Separador se tiver ambos */}
      {linhasAlteradas.length > 0 && linhasIguais.length > 0 && (
        <p className="text-[10px] text-slate-400 uppercase tracking-wide pt-2 pb-1">Campos não alterados</p>
      )}

      {/* Linhas não alteradas */}
      {linhasIguais.map(key => (
        <div key={key} className="flex items-start gap-2 px-3 py-1 rounded-md bg-slate-50 dark:bg-slate-800/40">
          <span className="text-slate-400 shrink-0 min-w-[80px] break-all">{key}</span>
          <span className="text-slate-500 dark:text-slate-400 break-all">
            {formatVal((novo || anterior || {})[key])}
          </span>
        </div>
      ))}
    </div>
  )
}

function JsonView({ data }: { data: any }) {
  if (!data) return <p className="text-xs text-slate-400">—</p>

  const camposIgnorados = new Set(['created_at', 'updated_at'])
  const formatVal = (v: any): string => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  return (
    <div className="space-y-1 text-xs font-mono">
      {Object.entries(data)
        .filter(([k]) => !camposIgnorados.has(k))
        .map(([key, val]) => (
          <div key={key} className="flex items-start gap-2 px-3 py-1 rounded-md bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 shrink-0 min-w-[100px]">{key}</span>
            <span className="text-slate-700 dark:text-slate-300 break-all">{formatVal(val)}</span>
          </div>
        ))}
    </div>
  )
}

export function AuditLogModal({ log, onClose }: Props) {
  const moduloLabel = TABELAS_OPCOES.find(t => t.value === log.tabela)?.label || log.tabela
  const acaoLabel = ACAO_LABELS[log.acao] || log.acao
  const acaoCor = ACAO_COLORS[log.acao] || 'bg-slate-100 text-slate-600'

  const isUpdate = log.acao === 'UPDATE' || log.acao === 'EDITAR_ALOCACAO'
  const temAnterior = !!log.dados_anteriores
  const temNovo = !!log.dados_novos

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${acaoCor}`}>
                {acaoLabel}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">em</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                {moduloLabel}
              </span>
            </div>
            {log.descricao && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug max-w-sm">
                {log.descricao}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 px-5 py-3 border-r border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Data/Hora</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{formatDateTime(log.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-3">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Responsável</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{log.usuario_nome || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-3 border-t border-r border-slate-100 dark:border-slate-800">
            <Database className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Módulo</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{moduloLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">ID do Registro</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-mono truncate max-w-[160px]" title={log.registro_id}>
                {log.registro_id}
              </p>
            </div>
          </div>
        </div>

        {/* Dados */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* UPDATE / EDITAR_ALOCACAO — diff side a side */}
          {isUpdate && temAnterior && temNovo && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Alterações realizadas
                </h3>
              </div>
              <JsonDiff anterior={log.dados_anteriores} novo={log.dados_novos} />
            </div>
          )}

          {/* CREATE — só dados novos */}
          {log.acao === 'CREATE' && temNovo && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Dados criados
                </h3>
              </div>
              <JsonView data={log.dados_novos} />
            </div>
          )}

          {/* DELETE — só dados anteriores */}
          {log.acao === 'DELETE' && temAnterior && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Dados excluídos
                </h3>
              </div>
              <JsonView data={log.dados_anteriores} />
            </div>
          )}

          {/* ALOCAR / DESALOCAR */}
          {(log.acao === 'ALOCAR' || log.acao === 'DESALOCAR') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Dados da {log.acao === 'ALOCAR' ? 'alocação' : 'desalocação'}
                </h3>
              </div>
              <JsonView data={log.acao === 'ALOCAR' ? log.dados_novos : log.dados_anteriores} />
            </div>
          )}

          {/* Fallback — sem dados estruturados */}
          {!temAnterior && !temNovo && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <FileText className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Sem dados detalhados disponíveis.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Fechar
          </button>
        </div>
      </aside>
    </div>
  )
}