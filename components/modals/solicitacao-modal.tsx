'use client'

import { useState } from 'react'
import { X, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { StatusSolicitacaoBadge, PrioridadeBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { useCrud } from '@/hooks/use-crud'
import { formatDate, mapTipoSolicitacao, mapTipoDispositivo, mapOrigem } from '@/lib/utils'
import type { Solicitacao } from '@/types'
import { optionalInt } from '@/lib/zod-helpers'
import { AnimatedSheetFrame } from '@/components/layout/motion-primitives'

const schema = z.object({
  colaborador_relacionado: z.string().optional().nullable(),
  solicitante: z.string().optional().nullable(),
  tipo_solicitacao: optionalInt,
  tipo_dispositivo: optionalInt,
  status_solicitacao: optionalInt,
  prioridade: optionalInt,
  observacao: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props {
  solicitacao: Solicitacao
  onClose: () => void
  onRefresh: () => void
}

export function SolicitacaoModal({ solicitacao, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { update, remove, saving, deleting } = useCrud('solicitacoes', () => {
    onRefresh()
    onClose()
  })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      colaborador_relacionado: solicitacao.colaborador_relacionado,
      solicitante: solicitacao.solicitante,
      tipo_solicitacao: solicitacao.tipo_solicitacao,
      tipo_dispositivo: solicitacao.tipo_dispositivo,
      status_solicitacao: solicitacao.status_solicitacao,
      prioridade: solicitacao.prioridade,
      observacao: solicitacao.observacao,
    },
  })

  function onSubmit(data: FormData) {
    update(solicitacao.id, data)
  }

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <>
      <AnimatedSheetFrame onClose={onClose}>

          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {mode === 'edit' ? 'Editar Solicitação' : 'Solicitação'}
              </h2>
              {mode === 'view' && (
                <div className="flex items-center gap-2 mt-1">
                  <StatusSolicitacaoBadge status={solicitacao.status_solicitacao} />
                  <PrioridadeBadge prioridade={solicitacao.prioridade} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — view */}
          {mode === 'view' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <DetailSection title="Informações">
                <DetailField label="Data" value={formatDate(solicitacao.data_criacao)} />
                <DetailField label="Solicitante" value={solicitacao.solicitante} />
                <DetailField label="Colaborador Relacionado" value={solicitacao.colaborador_relacionado} />
                <DetailField label="Origem" value={mapOrigem(solicitacao.origem_solicitacao)} />
              </DetailSection>
              <DetailSection title="Detalhes">
                <DetailField label="Tipo" value={mapTipoSolicitacao(solicitacao.tipo_solicitacao)} />
                <DetailField label="Dispositivo" value={mapTipoDispositivo(solicitacao.tipo_dispositivo)} />
                <DetailField label="Identificador" value={solicitacao.identificador_dispositivo} />
                <DetailField label="Status" value={<StatusSolicitacaoBadge status={solicitacao.status_solicitacao} />} />
                <DetailField label="Prioridade" value={<PrioridadeBadge prioridade={solicitacao.prioridade} />} />
              </DetailSection>
              {solicitacao.observacao && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Observação</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 leading-relaxed">
                    {solicitacao.observacao}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Body — edit */}
          {mode === 'edit' && (
            <div className="flex-1 overflow-y-auto p-5">
              <form id="sol-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e) }} noValidate>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Colaborador Relacionado</label>
                      <input {...register('colaborador_relacionado')} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Solicitante</label>
                      <input {...register('solicitante')} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Tipo de Solicitação</label>
                      <select {...register('tipo_solicitacao')} className={inp}>
                        <option value="">—</option>
                        <option value="1">Suporte</option>
                        <option value="2">Instalação</option>
                        <option value="3">Troca</option>
                        <option value="4">Configuração</option>
                        <option value="5">Manutenção</option>
                        <option value="6">Novo ativo</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Dispositivo</label>
                      <select {...register('tipo_dispositivo')} className={inp}>
                        <option value="">—</option>
                        <option value="1">Máquina</option>
                        <option value="2">Notebook</option>
                        <option value="3">Aparelho</option>
                        <option value="4">Impressora</option>
                        <option value="5">Ramal</option>
                        <option value="6">Rack</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Status</label>
                      <select {...register('status_solicitacao')} className={inp}>
                        <option value="1">Aberto</option>
                        <option value="2">Em andamento</option>
                        <option value="3">Pendente</option>
                        <option value="4">Concluído</option>
                        <option value="5">Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Prioridade</label>
                      <select {...register('prioridade')} className={inp}>
                        <option value="1">Baixa</option>
                        <option value="2">Média</option>
                        <option value="3">Alta</option>
                        <option value="4">Crítica</option>
                        <option value="5">Urgente</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Observação</label>
                    <textarea {...register('observacao')} rows={4} className={inp} />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            {mode === 'view' ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {e.preventDefault(); setShowDeleteConfirm(true)}}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
                <button
                  type="button"
                  onClick={(e) => {e.preventDefault(); setMode('edit')}}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => {e.preventDefault(); setMode('view')}}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="sol-form"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar alterações
                </button>
              </>
            )}
          </div>
      </AnimatedSheetFrame>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Excluir solicitação"
          description="Excluir esta solicitação? Esta ação não pode ser desfeita."
          onConfirm={() => remove(solicitacao.id)}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleting}
        />
      )}
    </>
  )
}
