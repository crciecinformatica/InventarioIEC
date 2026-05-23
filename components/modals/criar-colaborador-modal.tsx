'use client'

import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SetorSelect } from '@/components/modals/setor-select'
import { LocalidadeSelect } from '@/components/modals/localidade-select'
import { useCreate } from '@/hooks/use-create'
import { useState } from 'react'
import { AnimatedSheetFrame } from '@/components/layout/motion-primitives'

const schema = z.object({
  nome:   z.string().min(1, 'Nome obrigatório'),
  codigo: z.union([z.number(), z.null()]).optional(),
  status: z.enum(['Ativo', 'Inativo']),
})
type FormData = z.infer<typeof schema>

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarColaboradorModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('colaboradores', () => { onRefresh(); onClose() })
  const [setorId, setSetorId] = useState<string | null>(null)
  const [localidadeId, setLocalidadeId] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Ativo' },
  })

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
  const err = "text-xs text-red-500 mt-0.5"

  return (
    <AnimatedSheetFrame onClose={onClose}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Novo Colaborador</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-colab-form" onSubmit={handleSubmit((data) => create({ ...data, setor_id: setorId, localidade_id: localidadeId }))} noValidate className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Nome *</label>
                <input {...register('nome')} className={inp} placeholder="Nome completo" />
                {errors.nome && <p className={err}>{errors.nome.message}</p>}
              </div>
              <div>
                <label className={lbl}>Código de Pessoa</label>
                <input type="number" {...register('codigo', { valueAsNumber: true })} className={inp} placeholder="Ex: 12345" />
              </div>
              <div>
                <label className={lbl}>Setor</label>
                <SetorSelect
                  value={setorId}
                  onChange={(id) => setSetorId(id)}
                />
              </div>  
              <div>
                <label className={lbl}>Localidade</label>
                <LocalidadeSelect
                  value={localidadeId}
                  onChange={(id) => { setLocalidadeId(id) }}
                />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select {...register('status')} className={inp}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Cancelar
          </button>
          <button type="submit" form="criar-colab-form" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar colaborador
          </button>
        </div>
    </AnimatedSheetFrame>
  )
}
