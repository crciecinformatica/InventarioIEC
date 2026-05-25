'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SetorSelect } from '@/components/modals/setor-select'
import { LocalidadeSelect } from '@/components/modals/localidade-select'
import { useCreate } from '@/hooks/use-create'
import { optionalInt } from '@/lib/zod-helpers'
import { AnimatedSheetFrame } from '@/components/layout/motion-primitives'

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

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarRackModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('racks', () => { onRefresh(); onClose() })
  const [setorId, setSetorId] = useState<string | null>(null)
  const [localidadeId, setLocalidadeId] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { quantidade_portas: undefined, portas_em_uso: undefined },
  })

  async function onSubmit(data: FormData) {
    await create({ ...data, setor_id: setorId, localidade_id: localidadeId })
  }

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <AnimatedSheetFrame onClose={onClose}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Novo Rack</h2>
          <button type="button" onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-rack-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Nome do Switch</label>
                <input {...register('nome_switch')} className={inp} placeholder="Ex: SW-TI-01" />
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
                <SetorSelect value={setorId} onChange={(id) => setSetorId(id)} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Localidade</label>
                <LocalidadeSelect value={localidadeId} onChange={(id) => { setLocalidadeId(id) }} />
              </div>
              <div>
                <label className={lbl}>Total de Portas</label>
                <input type="number" {...register('quantidade_portas')} className={inp} min="0" />
              </div>
              <div>
                <label className={lbl}>Portas em Uso</label>
                <input type="number" {...register('portas_em_uso')} className={inp} min="0" />
              </div>
              <p className="col-span-2 text-xs text-slate-400 -mt-1">
                As portas livres serão calculadas automaticamente.
              </p>
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

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Cancelar
          </button>
          <button type="submit" form="criar-rack-form" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar rack
          </button>
        </div>
    </AnimatedSheetFrame>
  )
}
