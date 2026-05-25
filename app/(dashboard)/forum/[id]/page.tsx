'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { VinculosSection } from '@/components/forum/vinculos-section'
import { ItemVincularSelect } from '@/components/forum/item-vincular-select'
import { ReacaoButton } from '@/components/forum/reacao-button'
import { AlertTriangle } from 'lucide-react'
import { AnimatedDialogFrame } from '@/components/layout/motion-primitives'
import {
  ArrowLeft, Lock, Pin, MessageSquare,
  Eye, Pencil, Trash2, Loader2, Check, X,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function TopicoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id as string
  const perfil = (session?.user as any)?.perfil as string

  const [topico, setTopico] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Novo comentário
  const [novoConteudo, setNovoConteudo] = useState('')
  const [novoVinculos, setNovoVinculos] = useState<any[]>([])
  const [savingComentario, setSavingComentario] = useState(false)

  // Edição inline
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editConteudo, setEditConteudo] = useState('')

  function load() {
    setLoading(true)
    fetch(`/api/forum/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTopico(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const viewRegistered = useRef(false)
  useEffect(() => {
    if (viewRegistered.current) return
    viewRegistered.current = true
    fetch(`/api/forum/${id}/view`, { method: 'POST' }).catch(() => {})
  }, [id])

  useEffect(() => { load() }, [id])

  async function submitComentario(e: React.FormEvent) {
    e.preventDefault()
    if (!novoConteudo.trim()) return
    setSavingComentario(true)
    try {
      const res = await fetch(`/api/forum/${id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: novoConteudo, vinculos: novoVinculos }),
      })
      if (!res.ok) throw new Error()
      toast.success('Comentário adicionado!')
      setNovoConteudo('')
      setNovoVinculos([])
      load()
    } catch { toast.error('Erro ao comentar.') }
    finally { setSavingComentario(false) }
  }

  async function deletarComentario(cid: string) {
    try {
      await fetch(`/api/forum/${id}/comentarios/${cid}`, { method: 'DELETE' })
      toast.success('Comentário removido.')
      load()
    } catch { toast.error('Erro ao remover.') }
  }

  async function salvarEdicao(cid: string) {
    try {
      await fetch(`/api/forum/${id}/comentarios/${cid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: editConteudo }),
      })
      setEditandoId(null)
      load()
    } catch { toast.error('Erro ao editar.') }
  }

  async function toggleAdmin(campo: string) {
    await fetch(`/api/forum/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: !topico[campo] }),
    })
    load()
  }

  async function deletarTopico() {
    setDeleting(true)

    try {
      const res = await fetch(`/api/forum/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error()

      toast.success('Tópico removido com sucesso.')
      router.push('/forum')
      router.refresh()
    } catch {
      toast.error('Erro ao remover tópico.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
    </div>
  )

  if (!topico) return (
    <div className="p-6 text-center text-slate-400">Tópico não encontrado.</div>
  )

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <button type="button" onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition mb-4">
        <ArrowLeft className="w-4 h-4" /> Fórum
      </button>

      {/* Tópico */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {topico.fixado && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600"><Pin className="w-3 h-3" />Fixado</span>}
              {topico.fechado && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400"><Lock className="w-3 h-3" />Fechado</span>}
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{topico.titulo}</h1>
          </div>
          {/* Ações admin */}
          {(topico.autor_id === userId || perfil === 'admin') && (
            <div className="flex gap-1 shrink-0">
              {perfil === 'admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleAdmin('fixado')}
                    title={topico.fixado ? 'Desafixar' : 'Fixar'}
                    className={`p-1.5 rounded-lg transition ${
                      topico.fixado
                        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950'
                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAdmin('fechado')}
                    title={topico.fechado ? 'Abrir' : 'Fechar'}
                    className={`p-1.5 rounded-lg transition ${
                      topico.fechado
                        ? 'text-slate-600 bg-slate-100 dark:bg-slate-800'
                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Excluir tópico"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-3">
          {topico.conteudo}
        </p>
        <VinculosSection vinculos={topico.vinculos ?? []} />

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 text-xs text-slate-400">
          <span>{topico.autor_nome}</span>
          <span>{formatDate(topico.created_at)}</span>
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{topico.views}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{topico.comentarios?.length ?? 0}</span>
        </div>
      </div>

      {/* Comentários */}
      <div className="space-y-4 mb-6">
        {topico.comentarios?.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-4">Nenhum comentário ainda. Seja o primeiro!</p>
        )}
        {topico.comentarios?.map((c: any) => (
          <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="flex">
              <div className="w-1 bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{c.autor_nome}</span>
                    {' · '}{formatDate(c.created_at)}
                    {c.editado && <span className="ml-1 text-slate-400">(editado)</span>}
                  </div>
                  {(c.autor_id === userId || perfil === 'admin') && (
                    <div className="flex gap-1">
                      {c.autor_id === userId && editandoId !== c.id && (
                        <button type="button" onClick={() => { setEditandoId(c.id); setEditConteudo(c.conteudo) }}
                          className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition">
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      <button type="button" onClick={() => deletarComentario(c.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {editandoId === c.id ? (
                  <div className="space-y-2">
                    <textarea value={editConteudo} onChange={e => setEditConteudo(e.target.value)} rows={4} className={inp} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => salvarEdicao(c.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <Check className="w-3 h-3" /> Salvar
                      </button>
                      <button type="button" onClick={() => setEditandoId(null)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {c.conteudo}
                  </p>
                )}

                <VinculosSection vinculos={c.vinculos ?? []} />

                <div className="mt-3">
                  <ReacaoButton topicoId={id} comentarioId={c.id} reacoes={c.reacoes ?? []} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form novo comentário */}
      {!topico.fechado ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Adicionar comentário</h3>
          <form onSubmit={submitComentario} className="space-y-3">
            <textarea value={novoConteudo} onChange={e => setNovoConteudo(e.target.value)} rows={4}
              placeholder="Escreva sua resposta..." className={inp} />
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
              <ItemVincularSelect vinculos={novoVinculos} onChange={setNovoVinculos} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={savingComentario || !novoConteudo.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
                {savingComentario && <Loader2 className="w-4 h-4 animate-spin" />}
                Comentar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-4 border border-slate-100 dark:border-slate-800 rounded-xl text-sm text-slate-400">
          <Lock className="w-4 h-4 mx-auto mb-1" />
          Este tópico está fechado para novos comentários.
        </div>
      )}
      {showDeleteConfirm && (
        <AnimatedDialogFrame
          onClose={() => setShowDeleteConfirm(false)}
          zClassName="z-[60]"
          className="max-w-md rounded-xl border border-slate-100 p-6 dark:border-slate-800"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Excluir tópico
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 mb-5">
            Deseja realmente excluir o tópico{' '}
            <strong>"{topico.titulo}"</strong>?
          </p>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={deletarTopico}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-60"
            >
              {deleting && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}

              Confirmar exclusão
            </button>
          </div>
        </AnimatedDialogFrame>
      )}
    </div>
  )
}