'use client'

import { useState } from 'react'
import { ThumbsUp, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface Reacao { usuario_id: string; tipo: string }

interface Props {
  topicoId: string
  comentarioId: string
  reacoes: Reacao[]
}

export function ReacaoButton({ topicoId, comentarioId, reacoes }: Props) {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id as string
  const [lista, setLista] = useState(reacoes)

  const count = (tipo: string) => lista.filter(r => r.tipo === tipo).length
  const ativo = (tipo: string) => lista.some(r => r.usuario_id === userId && r.tipo === tipo)

  async function toggle(tipo: string) {
    if (!userId) return
    try {
      const res = await fetch(`/api/forum/${topicoId}/reacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario_id: comentarioId, tipo }),
      })
      const json = await res.json()
      setLista(prev =>
        json.acao === 'removida'
          ? prev.filter(r => !(r.usuario_id === userId && r.tipo === tipo))
          : [...prev, { usuario_id: userId, tipo }]
      )
    } catch { toast.error('Erro ao reagir.') }
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => toggle('util')}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition ${ativo('util') ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
        <ThumbsUp className="w-3.5 h-3.5" />
        <span>{count('util') || ''} Útil</span>
      </button>
      <button type="button" onClick={() => toggle('resolveu')}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition ${ativo('resolveu') ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
        <CheckCircle className="w-3.5 h-3.5" />
        <span>{count('resolveu') || ''} Resolveu</span>
      </button>
    </div>
  )
}