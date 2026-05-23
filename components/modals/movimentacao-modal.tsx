'use client'

import { useState } from 'react'
import { X, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { useCrud } from '@/hooks/use-crud'
import { formatDate, mapTipoDispositivo, mapTipoMovimentacao } from '@/lib/utils'
import type { Movimentacao } from '@/types'
import { optionalInt } from '@/lib/zod-helpers'
import { AnimatedSheetFrame } from '@/components/layout/motion-primitives'

const schema = z.object({
  identificador_dispositivo: z.string().optional().nullable(),
  tipo_dispositivo: optionalInt,
  tipo_movimentacao: optionalInt,
  setor: z.string().optional().nullable(),
  tecnico_responsavel: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props {
  movimentacao: Movimentacao
  onClose: () => void
  onRefresh: () => void
}

export function MovimentacaoModal({ movimentacao, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { update, remove, saving, deleting } = useCrud('movimentacoes', () => {
    onRefresh()
    onClose()
  })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      identificador_dispositivo: movimentacao.identificador_dispositivo,
      tipo_dispositivo: movimentacao.tipo_dispositivo,
      tipo_movimentacao: movimentacao.tipo_movimentacao,
      setor: movimentacao.setor,
      tecnico_responsavel: movimentacao.tecnico_responsavel,
      observacao: movimentacao.observacao,
    },
  })

  function onSubmit(data: FormData) {
    update(movimentacao.id, data)
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
                {mode === 'edit' ? 'Editar Movimentação' : 'Movimentação'}
              </h2>
              {mode === 'view' && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatDate(movimentacao.data_movimentacao)}
                </p>
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
              <DetailSection title="Dispositivo">
                <DetailField label="Identificador" value={movimentacao.identificador_dispositivo} />
                <DetailField label="Tipo de Dispositivo" value={mapTipoDispositivo(movimentacao.tipo_dispositivo)} />
                <DetailField label="Tipo de Movimentação" value={mapTipoMovimentacao(movimentacao.tipo_movimentacao)} />
              </DetailSection>
              <DetailSection title="Execução">
                <DetailField label="Data" value={formatDate(movimentacao.data_movimentacao)} />
                <DetailField label="Setor" value={movimentacao.setor} />
                <DetailField label="Técnico Responsável" value={movimentacao.tecnico_responsavel} />
                <DetailField label="Colaborador" value={movimentacao.colaborador?.nome} />
              </DetailSection>
              {movimentacao.observacao && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Observação</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 leading-relaxed">
                    {movimentacao.observacao}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Body — edit */}
          {mode === 'edit' && (
            <div className="flex-1 overflow-y-auto p-5">
              <form id="mov-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e) }} noValidate>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={lbl}>Identificador do Dispositivo</label>
                      <input {...register('identificador_dispositivo')} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Tipo de Dispositivo</label>
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
                      <label className={lbl}>Tipo de Movimentação</label>
                      <select {...register('tipo_movimentacao')} className={inp}>
                        <option value="">—</option>
                        <option value="1">Entrada</option>
                        <option value="2">Saída</option>
                        <option value="3">Transferência</option>
                        <option value="4">Manutenção</option>
                        <option value="5">Empréstimo</option>
                        <option value="6">Devolução</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Setor</label>
                      <input {...register('setor')} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Técnico Responsável</label>
                      <input {...register('tecnico_responsavel')} className={inp} />
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
                  form="mov-form"
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
          title="Excluir movimentação"
          description="Excluir esta movimentação? Esta ação não pode ser desfeita."
          onConfirm={() => remove(movimentacao.id)}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleting}
        />
      )}
    </>
  )
}
