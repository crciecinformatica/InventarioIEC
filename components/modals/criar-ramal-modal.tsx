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
  numero_ramal: z.string().optional().nullable(),
  prefixo_telefonico: z.string().optional().nullable(),
  senha_acesso: z.string().optional().nullable(),
  disponibilidade: z.string().optional().nullable(),
  fila: z.boolean().default(false),
  contemplacao: z.boolean().default(false),                
})

type FormData = z.infer<typeof schema>

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarRamalModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('ramais')
  const [colabId, setColabId] = useState('')
  const [colabNome, setColabNome] = useState('')
  const [setorId, setSetorId] = useState<string | null>(null)
  const [localidadeId, setLocalidadeId] = useState<string | null>(null)
  const [whatsapp, setWhatsapp] = useState(false)
  const [savingAlocacao, setSavingAlocacao] = useState(false)

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { fila: false, contemplacao: false },
  })

  async function onSubmit(data: FormData) {
    const ramal = await create({ ...data, setor_id: setorId, localidade_id: localidadeId })
    if (!ramal) return

    if (colabId) {
      setSavingAlocacao(true)
      try {
        const res = await fetch('/api/alocacoes/ramais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ramal_id: ramal.id, colaborador_id: colabId, whatsapp }),
        })
        if (!res.ok) throw new Error()
        toast.success('Ramal criado e alocado com sucesso!')
      } catch {
        toast.warning('Ramal criado, mas erro ao alocar colaborador.')
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Novo Ramal</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-ramal-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Número do Ramal</label><input
                type="text"
                {...register('numero_ramal')}
                className={inp}
                placeholder="Ex: 0028"
                onInput={(e) => {
                  const input = e.currentTarget
                  input.value = input.value.replace(/[^0-9]/g, '')
                }}
              /></div>
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
              <div><label className={lbl}>Prefixo Telefônico</label><input {...register('prefixo_telefonico')} className={inp} /></div>
              <div className="col-span-2">
                <label className={lbl}>Senha de Acesso</label>
                <input type="text" {...register('senha_acesso')} className={inp} placeholder="Senha do ramal" autoComplete="off" />
              </div>
              <div><label className={lbl}>Disponibilidade</label><input {...register('disponibilidade')} className={inp} /></div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="fila-criar" {...register('fila')} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="fila-criar" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Fila</label>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="cont-criar" {...register('contemplacao')} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="cont-criar" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Contemplação</label>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className={`${lbl} mb-1`}>Alocar a colaborador (opcional)</label>
                <ColaboradorSelect
                  value={colabId}
                  onChange={(id, nome) => { setColabId(id); setColabNome(nome) }}
                  onClear={() => { setColabId(''); setColabNome('') }}
                  selectedNome={colabNome}
                />
                {colabId && (
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Ramal com WhatsApp</span>
                  </label>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button type="submit" form="criar-ramal-form" disabled={saving || savingAlocacao}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {(saving || savingAlocacao) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar ramal
          </button>
        </div>
      </aside>
    </div>
  )
}
