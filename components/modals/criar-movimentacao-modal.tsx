'use client'

import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreate } from '@/hooks/use-create'
import { optionalInt } from '@/lib/zod-helpers'

const schema = z.object({
  data_movimentacao: z.string().optional().nullable(),
  identificador_dispositivo: z.string().optional().nullable(),
  tipo_dispositivo: optionalInt,
  tipo_movimentacao: optionalInt,
  setor: z.string().optional().nullable(),
  tecnico_responsavel: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarMovimentacaoModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('movimentacoes', () => { onRefresh(); onClose() })
  const { register, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nova Movimentação</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-mov-form" onSubmit={handleSubmit(create)} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Data</label>
                <input type="date" {...register('data_movimentacao')} className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Identificador do Dispositivo</label>
                <input {...register('identificador_dispositivo')} className={inp} placeholder="Ex: IEC-2024-001" />
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
              <div><label className={lbl}>Setor</label><input {...register('setor')} className={inp} /></div>
              <div><label className={lbl}>Técnico Responsável</label><input {...register('tecnico_responsavel')} className={inp} /></div>
              <div className="col-span-2">
                <label className={lbl}>Observação</label>
                <textarea {...register('observacao')} rows={3} className={inp} />
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button type="submit" form="criar-mov-form" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Registrar movimentação
          </button>
        </div>
      </aside>
    </div>
  )
}