'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ItemVincularSelect } from '@/components/forum/item-vincular-select'

export default function NovoTopicoPage() {
  const router = useRouter()
  const [titulo, setTitulo]     = useState('')
  const [conteudo, setConteudo] = useState('')
  const [vinculos, setVinculos] = useState<any[]>([])
  const [saving, setSaving]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !conteudo.trim()) { toast.error('Preencha todos os campos.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, conteudo, vinculos }),
      })
      if (!res.ok) throw new Error()
      const topico = await res.json()
      toast.success('Tópico criado!')
      router.push(`/forum/${topico.id}`)
    } catch { toast.error('Erro ao criar tópico.') }
    finally { setSaving(false) }
  }

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <button type="button" onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Novo Tópico</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Título *</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} className={inp}
            placeholder="Ex: Problema com impressora da sala 302 — solução encontrada" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Conteúdo *</label>
          <textarea value={conteudo} onChange={e => setConteudo(e.target.value)} rows={8} className={inp}
            placeholder="Descreva o problema, contexto, solução encontrada..." />
        </div>

        <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/40">
          <ItemVincularSelect vinculos={vinculos} onChange={setVinculos} />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Publicar tópico
          </button>
        </div>
      </form>
    </div>
  )
}