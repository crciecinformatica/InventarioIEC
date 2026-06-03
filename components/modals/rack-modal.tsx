'use client'
import { usePermission } from '@/hooks/use-permission'

import { useState } from 'react'
import { X, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { SetorSelect } from '@/components/modals/setor-select'
import { LocalidadeSelect } from '@/components/modals/localidade-select'
import { HistoricoPanel } from '@/components/modals/historico-panel'
import { useCrud } from '@/hooks/use-crud'
import { optionalInt } from '@/lib/zod-helpers'
import type { Rack } from '@/types'
import { AnimatedSheetFrame } from '@/components/layout/motion-primitives'
import { DeviceCommentsPopover } from '@/components/forum/device-comments-popover'

const schema = z.object({
  nome_switch:             z.string().optional().nullable(),
  marca_switch:            z.string().optional().nullable(),
  numero_patrimonio:       z.string().optional().nullable(),
  quantidade_portas:       optionalInt,
  portas_em_uso:           optionalInt,
  portas_academicas:       z.string().optional().nullable(),
  portas_vlan_impressoras: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

interface Props {
  rack: Rack
  onClose: () => void
  onRefresh: () => void
}

export function RackModal({ rack, onClose, onRefresh }: Props) {
  const { isAdmin, canRequestInventoryChanges } = usePermission()
  const [mode, setMode]               = useState<'view' | 'edit'>('view')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [setorId, setSetorId]         = useState<string | null>(rack.setor_id ?? null)
  const [localidadeId, setLocalidadeId] = useState<string | null>(rack.localidade_id ?? null)
  const { update, remove, saving, deleting } = useCrud('racks', () => {
    onRefresh()
    onClose()
  })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nome_switch:             rack.nome_switch,
      marca_switch:            rack.marca_switch,
      numero_patrimonio:       rack.numero_patrimonio,
      quantidade_portas:       rack.quantidade_portas,
      portas_em_uso:           rack.portas_em_uso,
      portas_academicas:       rack.portas_academicas,
      portas_vlan_impressoras: rack.portas_vlan_impressoras,
    },
  })

  function onSubmit(data: FormData) {
    update(rack.id, { ...data, setor_id: setorId, localidade_id: localidadeId }, {
      previousData: rack,
      label: `Rack "${rack.nome_switch}" atualizado`,
    })
  }


  // Calcular portas livres localmente para exibição no view
  const portasLivres = rack.quantidade_portas != null && rack.portas_em_uso != null
    ? Math.max(0, rack.quantidade_portas - rack.portas_em_uso)
    : rack.portas_livres

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <>
      <DeviceCommentsPopover
        tipoItem="racks"
        itemId={rack.id}
        itemLabel={rack.nome_switch ?? rack.numero_patrimonio}
      />
      <AnimatedSheetFrame onClose={onClose}>

          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {mode === 'edit' ? 'Editar Rack' : (rack.nome_switch || 'Rack')}
              </h2>
              {mode === 'view' && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {rack.setor_nome ?? rack.localizacao ?? '—'}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* View */}
          {mode === 'view' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <DetailSection title="Identificação">
                <DetailField label="Nome do Switch" value={rack.nome_switch} />
                <DetailField label="Marca"          value={rack.marca_switch} />
                <DetailField label="Patrimônio"     value={rack.numero_patrimonio} />
                <DetailField label="Setor"          value={rack.setor_nome ?? rack.localizacao} />
                <DetailField label="Localidade"     value={rack.localidade_nome ?? '—'} />
              </DetailSection>

              <DetailSection title="Portas">
                <DetailField label="Total de Portas"  value={rack.quantidade_portas != null ? String(rack.quantidade_portas) : null} />
                <DetailField label="Portas em Uso"    value={rack.portas_em_uso != null ? String(rack.portas_em_uso) : null} />
                <DetailField
                  label="Portas Livres"
                  value={
                    portasLivres != null ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {portasLivres}
                      </span>
                    ) : null
                  }
                />
                <DetailField label="Portas Acadêmicas"       value={rack.portas_academicas} />
                <DetailField label="Portas VLAN Impressoras"  value={rack.portas_vlan_impressoras} />
              </DetailSection>

              <HistoricoPanel registroId={rack.id} tabela="racks" />
            </div>
          )}

          {/* Edit */}
          {mode === 'edit' && (
            <div className="flex-1 overflow-y-auto p-5">
              <form id="rack-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={lbl}>Nome do Switch</label>
                    <input {...register('nome_switch')} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Marca</label>
                    <input {...register('marca_switch')} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Patrimônio</label>
                    <input {...register('numero_patrimonio')} className={inp} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Setor</label>
                    <SetorSelect
                      value={setorId}
                      onChange={(id) => setSetorId(id)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Localidade</label>
                    <LocalidadeSelect
                      value={localidadeId}
                      onChange={(id) => { setLocalidadeId(id) }}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Total de Portas</label>
                    <input type="number" {...register('quantidade_portas')} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Portas em Uso</label>
                    <input type="number" {...register('portas_em_uso')} className={inp} />
                  </div>
                  {/* Portas livres — somente leitura, calculado */}
                  <div className="col-span-2">
                    <label className={lbl}>Portas Livres (calculado automaticamente)</label>
                    <div className="w-full px-3 py-2 text-sm border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-green-600 dark:text-green-400 font-semibold">
                      {/* Calculado em tempo real via JS simples */}
                      Será calculado ao salvar
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Portas Acadêmicas</label>
                    <input {...register('portas_academicas')} className={inp} placeholder="Ex: 1-12" />
                  </div>
                  <div>
                    <label className={lbl}>Portas VLAN Impressoras</label>
                    <input {...register('portas_vlan_impressoras')} className={inp} />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            {mode === 'view' ? (
              <>
{(isAdmin || canRequestInventoryChanges) && (                <button type="button" onClick={(e) => {e.preventDefault(); setShowDeleteConfirm(true)}}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>)}
{(isAdmin || canRequestInventoryChanges) && (                <button type="button" onClick={(e) => {e.preventDefault(); setMode('edit')}}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>)}
              </>
            ) : (
              <>
                <button type="button" onClick={(e) => {e.preventDefault(); setMode('view')}}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Cancelar
                </button>
                <button type="submit" form="rack-form" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar alterações
                </button>
              </>
            )}
          </div>
      </AnimatedSheetFrame>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Excluir rack"
          description={`Excluir "${rack.nome_switch}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => remove(rack.id)}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleting}
        />
      )}
    </>
  )
}
