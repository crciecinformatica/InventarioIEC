'use client'

import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreate } from '@/hooks/use-create'
import { optionalInt, intWithDefault } from '@/lib/zod-helpers'

const schema = z.object({
  data_criacao: z.string().optional().nullable(),
  colaborador_relacionado: z.string().optional().nullable(),
  solicitante: z.string().optional().nullable(),
  identificador_dispositivo: z.string().optional().nullable(),
  tipo_dispositivo: optionalInt,
  tipo_solicitacao: optionalInt,
  status_solicitacao: intWithDefault(1),
  prioridade: intWithDefault(2),
  origem_solicitacao: optionalInt,
  observacao: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarSolicitacaoModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('solicitacoes', () => { onRefresh(); onClose() })
  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status_solicitacao: 1, prioridade: 2 },
  })

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nova Solicitação</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-sol-form" onSubmit={handleSubmit(create)} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Data</label>
                <input type="date" {...register('data_criacao')} className={inp} />
              </div>
              <div><label className={lbl}>Colaborador Relacionado</label><input {...register('colaborador_relacionado')} className={inp} /></div>
              <div><label className={lbl}>Solicitante</label><input {...register('solicitante')} className={inp} /></div>
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
              <div className="col-span-2">
                <label className={lbl}>Identificador do Dispositivo</label>
                <input {...register('identificador_dispositivo')} className={inp} />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select {...register('status_solicitacao')} className={inp}>
                  <option value="1">Aberto</option>
                  <option value="2">Em andamento</option>
                  <option value="3">Pendente</option>
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
              <div>
                <label className={lbl}>Origem</label>
                <select {...register('origem_solicitacao')} className={inp}>
                  <option value="">—</option>
                  <option value="1">E-mail</option>
                  <option value="2">Telefone</option>
                  <option value="3">Presencial</option>
                  <option value="4">Sistema</option>
                  <option value="5">WhatsApp</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Observação</label>
                <textarea {...register('observacao')} rows={3} className={inp} />
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button type="submit" form="criar-sol-form" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar solicitação
          </button>
        </div>
      </aside>
    </div>
  )
}