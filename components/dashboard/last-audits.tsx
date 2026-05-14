import Link from 'next/link'
import { ScrollText, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'

const ACAO_COLORS: Record<string, string> = {
  CREATE:          'bg-green-500',
  UPDATE:          'bg-blue-500',
  DELETE:          'bg-red-500',
  ALOCAR:          'bg-violet-500',
  DESALOCAR:       'bg-orange-500',
  EDITAR_ALOCACAO: 'bg-amber-500',
}

const ACAO_LABELS: Record<string, string> = {
  CREATE:          'Criação',
  UPDATE:          'Edição',
  DELETE:          'Exclusão',
  ALOCAR:          'Alocação',
  DESALOCAR:       'Desalocação',
  EDITAR_ALOCACAO: 'Ed. Alocação',
}

const TABELAS_LABELS: Record<string, string> = {
  maquinas:           'Máquinas',
  notebooks:          'Notebooks',
  aparelhos:          'Aparelhos',
  impressoras:        'Impressoras',
  ramais:             'Ramais',
  racks:              'Racks',
  colaboradores:      'Colaboradores',
  alocacoes_maquinas: 'Alocações',
  alocacoes_notebooks:'Alocações',
  alocacoes_aparelhos:'Alocações',
  alocacoes_ramais:   'Alocações',
}

async function getUltimasAuditorias() {
  return prisma.audit_log.findMany({
    where: { tabela: { not: 'solicitacoes' } },
    orderBy: { created_at: 'desc' },
    take: 5,
  })
}

export async function UltimasAuditoriasCard() {
  const logs = await getUltimasAuditorias()

  function formatDateTime(dt: string | Date | null) {
    if (!dt) return '—'
    const d = new Date(dt)
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col mt-6">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
            <ScrollText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Últimas Auditorias
          </h2>
        </div>
        <Link
          href="/movimentacoes"
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
        >
          Ver todas →
        </Link>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800/60 flex-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs">
            <ScrollText className="w-8 h-8 mb-2 opacity-30" />
            Nenhum registro ainda.
          </div>
        ) : (
          logs.map((log) => (
            <Link
              key={log.id}
              href={`/movimentacoes?inspect=${log.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
            >
              {/* Dot colorido */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${ACAO_COLORS[log.acao] || 'bg-slate-400'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {ACAO_LABELS[log.acao] || log.acao}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {TABELAS_LABELS[log.tabela] || log.tabela}
                  </span>
                </div>
                {log.descricao && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {log.descricao}
                  </p>
                )}
              </div>

              {/* Meta */}
              <div className="text-right shrink-0">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {formatDateTime(log.created_at)}
                </p>
                {log.usuario_nome && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[100px]">
                    {log.usuario_nome}
                  </p>
                )}
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 group-hover:text-blue-500 transition" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
