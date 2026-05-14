'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ColaboradorSelect } from '@/components/modals/colaborador-select'
import { SetorSelect } from '@/components/modals/setor-select'
import { LocalidadeSelect } from '@/components/modals/localidade-select'
import { useCreate } from '@/hooks/use-create'

const schema = z.object({
  modelo: z.string().optional().nullable(),
  fabricante: z.string().optional().nullable(),
  categoria: z.enum(['Administrativa', 'Academica']).optional().nullable(),
  processador: z.string().optional().nullable(),
  memoria: z.string().optional().nullable(),
  armazenamento: z.string().optional().nullable(),
  numero_patrimonio: z.string().optional().nullable(),
  data_revisao: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarNotebookModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('notebooks')
  const [colabId, setColabId] = useState('')
  const [colabNome, setColabNome] = useState('')
  const [savingAlocacao, setSavingAlocacao] = useState(false)
  const [setorId, setSetorId] = useState<string | null>(null)
  const [localidadeId, setLocalidadeId] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const notebook = await create({ ...data, setor_id: setorId, localidade_id: localidadeId })
    if (!notebook) return

    if (colabId) {
      setSavingAlocacao(true)
      try {
        const res = await fetch('/api/alocacoes/notebooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notebook_id: notebook.id, colaborador_id: colabId }),
        })
        if (!res.ok) throw new Error()
        toast.success('Notebook criado e alocado com sucesso!')
      } catch {
        toast.warning('Notebook criado, mas erro ao alocar colaborador.')
      } finally {
        setSavingAlocacao(false)
      }
    }

    onRefresh()
    onClose()
  }

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Novo Notebook</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-nb-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Modelo</label><input {...register('modelo')} className={inp} /></div>
              <div><label className={lbl}>Fabricante</label><input {...register('fabricante')} className={inp} /></div>
              <div className="col-span-2">
                <label className={lbl}>Categoria</label>
                <select {...register('categoria')} className={inp}>
                  <option value="">Selecione...</option>
                  <option value="Administrativa">Administrativa</option>
                  <option value="Academica">Acadêmica</option>
                </select>
              </div>
              <div><label className={lbl}>Processador</label><input {...register('processador')} className={inp} /></div>
              <div><label className={lbl}>Memória</label><input {...register('memoria')} className={inp} /></div>
              <div><label className={lbl}>Armazenamento</label><input {...register('armazenamento')} className={inp} /></div>
              <div><label className={lbl}>Nº Patrimônio</label><input {...register('numero_patrimonio')} className={inp} /></div>
              <div><label className={lbl}>Última revisão</label><input type="date" {...register('data_revisao')} className={inp} /></div>
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
              <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className={`${lbl} mb-2`}>Alocar a colaborador (opcional)</label>
                <ColaboradorSelect
                  value={colabId}
                  onChange={(id, nome) => { setColabId(id); setColabNome(nome) }}
                  onClear={() => { setColabId(''); setColabNome('') }}
                  selectedNome={colabNome}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button type="submit" form="criar-nb-form" disabled={saving || savingAlocacao}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {(saving || savingAlocacao) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar notebook
          </button>
        </div>
      </aside>
    </div>
  )
}
