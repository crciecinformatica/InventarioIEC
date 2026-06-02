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
import { AnimatedSheetFrame } from '@/components/layout/motion-primitives'

const schema = z.object({
  nome_host: z.string().optional().nullable(),
  fabricante: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  categoria: z.enum(['Administrativa', 'Academica', 'Backup']).optional().nullable(),
  processador: z.string().optional().nullable(),
  memoria_ram: z.string().optional().nullable(),
  armazenamento: z.string().optional().nullable(),
  endereco_ip: z.string().optional().nullable(),
  localizacao: z.string().optional().nullable(),
  patrimonio_cpu: z.string().optional().nullable(),
  patrimonio_monitor: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarMaquinaModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('maquinas')
  const [colabId, setColabId] = useState('')
  const [colabNome, setColabNome] = useState('')
  const [savingAlocacao, setSavingAlocacao] = useState(false)
  const [setorId, setSetorId] = useState<string | null>(null)
  const [localidadeId, setLocalidadeId] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const maquina = await create({ ...data, setor_id: setorId, localidade_id: localidadeId })
    if (!maquina) return

    if ((maquina as any).__solicitacaoInventario) {
      onRefresh()
      onClose()
      return
    }

    if (colabId) {
      setSavingAlocacao(true)
      try {
        const res = await fetch('/api/alocacoes/maquinas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maquina_id: maquina.id, colaborador_id: colabId }),
        })
        if (!res.ok) throw new Error()
        toast.success('Máquina criada e alocada com sucesso!')
      } catch {
        toast.warning('Máquina criada, mas erro ao alocar colaborador.')
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
    <AnimatedSheetFrame onClose={onClose}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nova Máquina</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-maq-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Nome Host</label><input {...register('nome_host')} className={inp} /></div>
              <div><label className={lbl}>Fabricante</label><input {...register('fabricante')} className={inp} /></div>
              <div><label className={lbl}>Modelo</label><input {...register('modelo')} className={inp} /></div>
              <div className="col-span-2">
                <label className={lbl}>Categoria</label>
                <select {...register('categoria')} className={inp}>
                  <option value="">Selecione...</option>
                  <option value="Administrativa">Administrativa</option>
                  <option value="Academica">Acadêmica</option>
                  <option value="Backup">Backup</option>
                </select>
              </div>
              <div><label className={lbl}>Processador</label><input {...register('processador')} className={inp} /></div>
              <div><label className={lbl}>Memória RAM</label><input {...register('memoria_ram')} className={inp} /></div>
              <div><label className={lbl}>Armazenamento</label><input {...register('armazenamento')} className={inp} /></div>
              <div><label className={lbl}>Endereço IP</label><input {...register('endereco_ip')} className={inp} /></div>
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
              <div><label className={lbl}>Patrimônio CPU</label><input {...register('patrimonio_cpu')} className={inp} /></div>
              <div><label className={lbl}>Patrimônio Monitor</label><input {...register('patrimonio_monitor')} className={inp} /></div>

              {/* Alocação opcional */}
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
          <button type="submit" form="criar-maq-form" disabled={saving || savingAlocacao}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {(saving || savingAlocacao) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar máquina
          </button>
        </div>
    </AnimatedSheetFrame>
  )
}
