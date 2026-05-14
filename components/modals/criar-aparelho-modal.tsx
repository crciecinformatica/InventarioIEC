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
  endereco_ip: z.string().optional().nullable(),
  endereco_mac: z.string().optional().nullable(),
  chip: z.boolean().optional(),
  status: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarAparelhoModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('aparelhos')
  const [colabId, setColabId] = useState('')
  const [colabNome, setColabNome] = useState('')
  const [savingAlocacao, setSavingAlocacao] = useState(false)
  const [setorId, setSetorId] = useState<string | null>(null)
  const [localidadeId, setLocalidadeId] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { chip: false, status: true },
  })

  async function onSubmit(data: FormData) {
    const aparelho = await create({ ...data, setor_id: setorId, localidade_id: localidadeId })
    if (!aparelho) return

    if (colabId) {
      setSavingAlocacao(true)
      try {
        const res = await fetch('/api/alocacoes/aparelhos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aparelho_id: aparelho.id, colaborador_id: colabId }),
        })
        if (!res.ok) throw new Error()
        toast.success('Aparelho criado e alocado com sucesso!')
      } catch {
        toast.warning('Aparelho criado, mas erro ao alocar colaborador.')
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Novo Aparelho</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-ap-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className={lbl}>Modelo</label><input {...register('modelo')} className={inp} /></div>
              <div><label className={lbl}>Endereço IP</label><input {...register('endereco_ip')} className={inp} /></div>
              <div><label className={lbl}>Endereço MAC</label><input {...register('endereco_mac')} className={inp} /></div>
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
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="chip-criar" {...register('chip')} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="chip-criar" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Com chip</label>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="status-criar" {...register('status')} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="status-criar" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Ativo</label>
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
          <button type="submit" form="criar-ap-form" disabled={saving || savingAlocacao}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {(saving || savingAlocacao) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar aparelho
          </button>
        </div>
      </aside>
    </div>
  )
}
