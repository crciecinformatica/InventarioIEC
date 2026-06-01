'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { VinculosSection } from '@/components/forum/vinculos-section'
import { ItemVincularSelect } from '@/components/forum/item-vincular-select'
import { ReacaoButton } from '@/components/forum/reacao-button'
import { FileUploadButton } from '@/components/forum/file-upload-button'
import { ForumFileEmbed } from '@/components/forum/forum-file-embed'
import { AlertTriangle } from 'lucide-react'
import { AnimatedDialogFrame } from '@/components/layout/motion-primitives'
import {
  ArrowLeft, Lock, Pin, MessageSquare,
  Eye, Pencil, Trash2, Loader2, Check, X,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { pushInspectHistory } from '@/lib/navigation-context'

interface UploadedFile {
  id: string
  nome_original: string
  tipo_arquivo: string
  tamanho_bytes: number
  url_publica: string
}

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
  const [novoArquivos, setNovoArquivos] = useState<UploadedFile[]>([])
  const [savingComentario, setSavingComentario] = useState(false)
  const [showUploadNovoComentario, setShowUploadNovoComentario] = useState(false)
  const tempComentarioId = 'temp-c-' + Math.random().toString(36).substr(2, 9)

  // Edição inline de comentários
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editConteudo, setEditConteudo] = useState('')

  // Edição do Tópico
  const [editandoTopico, setEditandoTopico] = useState(false)
  const [editTitulo, setEditTitulo]         = useState('')
  const [editConteudoTopico, setEditConteudoTopico] = useState('')
  const [editVinculos, setEditVinculos]     = useState<any[]>([])
  const [editArquivos, setEditArquivos]     = useState<UploadedFile[]>([])
  const [showUploadEditTopico, setShowUploadEditTopico] = useState(false)
  const [savingTopico, setSavingTopico]     = useState(false)
  const [editComentarioArquivos, setEditComentarioArquivos] = useState<UploadedFile[]>([])
  const [showUploadEditComentario, setShowUploadEditComentario] = useState(false)

  // Handlers para upload na edição do comentário
  function handleFileUploadEditComentario(file: UploadedFile) {
    setEditComentarioArquivos(prev => [...prev, file])
  }

  async function deleteFileEditComentario(fileId: string) {
    try {
      const res = await fetch(`/api/forum/arquivos/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setEditComentarioArquivos(prev => prev.filter(f => f.id !== fileId))
    } catch (error) {
      toast.error('Erro ao deletar arquivo.')
    }
  }

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

  useEffect(() => {
    if (!topico?.id) return

    pushInspectHistory(window.sessionStorage, {
      path: `/forum/${topico.id}`,
      inspectId: topico.id,
      type: 'forum',
      label: 'Fórum',
      title: topico.titulo || 'Tópico do fórum',
      subtitle: topico.autor_nome ? `por ${topico.autor_nome}` : undefined,
      href: `/forum/${topico.id}`,
      timestamp: Date.now(),
    })
  }, [topico?.id, topico?.titulo, topico?.autor_nome])

  // Handlers para Upload de arquivos no Novo Comentário
  function handleFileUploadNovoComentario(file: UploadedFile) {
    setNovoArquivos(prev => [...prev, file])
  }

  async function deleteFileNovoComentario(fileId: string) {
    try {
      const res = await fetch(`/api/forum/arquivos/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setNovoArquivos(prev => prev.filter(f => f.id !== fileId))
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  // Handlers para Upload de arquivos na Edição do Tópico
  function handleFileUploadEditTopico(file: UploadedFile) {
    setEditArquivos(prev => [...prev, file])
  }

  async function deleteFileEditTopico(fileId: string) {
    try {
      const res = await fetch(`/api/forum/arquivos/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setEditArquivos(prev => prev.filter(f => f.id !== fileId))
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  async function submitComentario(e: React.FormEvent) {
    e.preventDefault()
    if (!novoConteudo.trim()) return
    setSavingComentario(true)
    try {
      const res = await fetch(`/api/forum/${id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conteudo: novoConteudo, 
          vinculos: novoVinculos, 
          arquivo_ids: novoArquivos.map(a => a.id) 
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Comentário adicionado!')
      setNovoConteudo('')
      setNovoVinculos([])
      setNovoArquivos([])
      setShowUploadNovoComentario(false)
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
        body: JSON.stringify({ 
          conteudo: editConteudo,
          arquivo_ids: editComentarioArquivos.map(a => a.id) // <-- Envia os arquivos
        }),
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

  async function salvarTopico() {
    if (!editTitulo.trim() || !editConteudoTopico.trim()) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    setSavingTopico(true)
    try {
      const res = await fetch(`/api/forum/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titulo: editTitulo, 
          conteudo: editConteudoTopico, 
          vinculos: editVinculos,
          arquivo_ids: editArquivos.map(a => a.id)
        }),
      })
      if (!res.ok) throw new Error()

      toast.success('Tópico atualizado!')
      setEditandoTopico(false)
      setShowUploadEditTopico(false)
      load()
    } catch { toast.error('Erro ao salvar.') }
    finally { setSavingTopico(false) }
  }

  async function deletarTopico() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/forum/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Tópico removido com sucesso.')
      router.push('/forum')
      router.refresh()
    } catch {
      toast.error('Erro ao remover tópico.')
    } {
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
            {!editandoTopico && <h1 className="text-lg font-bold text-slate-900 dark:text-white">{topico.titulo}</h1>}
          </div>
          
          {/* Ações admin / autor */}
          {(topico.autor_id === userId || perfil === 'admin') && (
            <div className="flex gap-1 shrink-0">
              {perfil === 'admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleAdmin('fixado')}
                    title={topico.fixado ? 'Desafixar' : 'Fixar'}
                    className={`p-1.5 rounded-lg transition ${
                      topico.fixado ? 'text-amber-600 bg-amber-50 dark:bg-amber-950' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAdmin('fechado')}
                    title={topico.fechado ? 'Abrir' : 'Fechar'}
                    className={`p-1.5 rounded-lg transition ${
                      topico.fechado ? 'text-slate-600 bg-slate-100 dark:bg-slate-800' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
              
              {!editandoTopico && (
                <button type="button"
                  onClick={() => {
                    setEditTitulo(topico.titulo)
                    setEditConteudoTopico(topico.conteudo)
                    setEditVinculos(topico.vinculos ?? [])
                    setEditArquivos(topico.arquivos ?? [])
                    setEditandoTopico(true)
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                  title="Editar tópico">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {editandoTopico ? (
          <div className="space-y-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Título *</label>
              <input value={editTitulo} onChange={e => setEditTitulo(e.target.value)} className={inp} placeholder="Título" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Conteúdo *</label>
              <textarea value={editConteudoTopico} onChange={e => setEditConteudoTopico(e.target.value)} rows={6} className={inp} placeholder="Conteúdo" />
            </div>
            
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
              <ItemVincularSelect vinculos={editVinculos} onChange={setEditVinculos} />
            </div>

            {/* Upload de arquivos na Edição do Tópico */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Anexos do Tópico</label>
                {editArquivos.length > 0 && <span className="text-xs text-slate-500">{editArquivos.length} arquivo(s)</span>}
              </div>

              {showUploadEditTopico ? (
                <FileUploadButton parentId={id} parentType="topico" onFileUpload={handleFileUploadEditTopico} disabled={savingTopico} />
              ) : (
                <button type="button" onClick={() => setShowUploadEditTopico(true)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  + Adicionar ou substituir arquivo
                </button>
              )}

              {editArquivos.length > 0 && (
                <div className="space-y-2">
                  {editArquivos.map(arquivo => (
                    <ForumFileEmbed key={arquivo.id} {...arquivo} canDelete={true} onDelete={deleteFileEditTopico} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={salvarTopico} disabled={savingTopico}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
                {savingTopico ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Salvar alterações
              </button>
              <button type="button" onClick={() => { setEditandoTopico(false); setShowUploadEditTopico(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <X className="w-3 h-3" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-4 mt-2">
              {topico.conteudo}
            </p>
            
            {/* Listagem estática de arquivos originais do Tópico */}
            {topico.arquivos && topico.arquivos.length > 0 && (
              <div className="space-y-2 mb-4 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Arquivos anexados:</p>
                {topico.arquivos.map((arquivo: any) => (
                  <ForumFileEmbed key={arquivo.id} {...arquivo} canDelete={false} />
                ))}
              </div>
            )}

            <VinculosSection vinculos={topico.vinculos ?? []} />
          </>
        )}
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
                        <button type="button" onClick={() => { 
                            setEditandoId(c.id); 
                            setEditConteudo(c.conteudo);
                            setEditComentarioArquivos(c.arquivos ?? []); // <-- Carrega arquivos existentes
                            setShowUploadEditComentario(false);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                          title="Editar comentário">
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      <button type="button" onClick={() => deletarComentario(c.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
                        title="Deletar comentário">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {editandoId === c.id ? (
  <div className="space-y-3">
    <textarea value={editConteudo} onChange={e => setEditConteudo(e.target.value)} rows={4} className={inp} />
    
    {/* Upload de arquivos na Edição do Comentário */}
    <div className="space-y-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Anexos do Comentário</label>
        {editComentarioArquivos.length > 0 && <span className="text-xs text-slate-500">{editComentarioArquivos.length} arquivo(s)</span>}
      </div>

      {showUploadEditComentario ? (
        <FileUploadButton parentId={c.id} parentType="comentario" onFileUpload={handleFileUploadEditComentario} disabled={false} />
      ) : (
        <button type="button" onClick={() => setShowUploadEditComentario(true)} className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          + Adicionar ou substituir arquivo
        </button>
      )}

      {editComentarioArquivos.length > 0 && (
        <div className="space-y-2">
          {editComentarioArquivos.map(arquivo => (
            <ForumFileEmbed key={arquivo.id} {...arquivo} canDelete={true} onDelete={deleteFileEditComentario} />
          ))}
        </div>
      )}
    </div>

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
                  <>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {c.conteudo}
                    </p>
                    
                    {/* Exibição dos arquivos anexados ao comentário */}
                    {c.arquivos && c.arquivos.length > 0 && (
                      <div className="space-y-2 mt-3 pt-2 border-t border-slate-50 dark:border-slate-800/40">
                        {c.arquivos.map((arquivo: any) => (
                          <ForumFileEmbed key={arquivo.id} {...arquivo} canDelete={false} />
                        ))}
                      </div>
                    )}
                  </>
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

            {/* Upload de arquivos no Novo Comentário */}
            <div className="space-y-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Anexar mídias ao comentário (opcional)
                </label>
                {novoArquivos.length > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">{novoArquivos.length} arquivo(s)</span>
                )}
              </div>

              {showUploadNovoComentario ? (
                <FileUploadButton parentId={tempComentarioId} parentType="comentario" onFileUpload={handleFileUploadNovoComentario} disabled={savingComentario} />
              ) : (
                <button type="button" onClick={() => setShowUploadNovoComentario(true)} className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  + Adicionar arquivo
                </button>
              )}

              {novoArquivos.length > 0 && (
                <div className="space-y-2">
                  {novoArquivos.map(arquivo => (
                    <ForumFileEmbed key={arquivo.id} {...arquivo} canDelete={true} onDelete={deleteFileNovoComentario} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
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

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <AnimatedDialogFrame onClose={() => setShowDeleteConfirm(false)} zClassName="z-[60]" className="max-w-md rounded-xl border border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Excluir tópico</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Esta ação não pode ser desfeita.</p>
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-5">
            Deseja realmente excluir o tópico <strong>"{topico.titulo}"</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              Cancelar
            </button>
            <button type="button" onClick={deletarTopico} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-60">
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar exclusão
            </button>
          </div>
        </AnimatedDialogFrame>
      )}
    </div>
  )
}
