'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ItemVincularSelect } from '@/components/forum/item-vincular-select'
import { FileUploadButton } from '@/components/forum/file-upload-button'
import { ForumFileEmbed } from '@/components/forum/forum-file-embed'
import { ForumEtiquetaSelect } from '@/components/forum/forum-etiquetas'
import { ForumFolderSelect, type ForumPastaSelecionada } from '@/components/forum/forum-folder-select'
import type { ForumEtiqueta } from '@/lib/forum'

interface UploadedFile {
  id: string
  nome_original: string
  tipo_arquivo: string
  tamanho_bytes: number
  url_publica: string
}

export default function NovoTopicoPage() {
  const router = useRouter()
  const [titulo, setTitulo]     = useState('')
  const [conteudo, setConteudo] = useState('')
  const [etiquetas, setEtiquetas] = useState<ForumEtiqueta[]>(['comentario'])
  const [vinculos, setVinculos] = useState<any[]>([])
  const [pastas, setPastas] = useState<ForumPastaSelecionada[]>([])
  const [arquivos, setArquivos] = useState<UploadedFile[]>([])
  const [saving, setSaving]     = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const tempTopicoId = 'temp-' + Math.random().toString(36).substr(2, 9)

  function handleFileUpload(file: UploadedFile) {
    setArquivos(prev => [...prev, file])
  }

  async function deleteFile(fileId: string) {
    try {
      const res = await fetch(`/api/forum/arquivos/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setArquivos(prev => prev.filter(f => f.id !== fileId))
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !conteudo.trim()) { toast.error('Preencha todos os campos.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          conteudo,
          etiquetas,
          vinculos,
          pasta_ids: pastas.map(pasta => pasta.id),
          arquivo_ids: arquivos.map(a => a.id),
        }),
      })
      if (!res.ok) throw new Error()
      const topico = await res.json()
      toast.success('Tópico criado!')
      router.push(`/forum/${topico.id}`)
    } catch { toast.error('Erro ao criar tópico.') }
    finally { setSaving(false) }
  }

  const inp = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 p-4 text-slate-100 md:p-6">
    <div className="mx-auto max-w-4xl">
      <button type="button" onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h1 className="text-2xl font-bold text-white">Novo tópico</h1>
        <p className="mt-1 text-sm text-slate-400">Registre trativas, tutoriais, comentários e ativos relacionados.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
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

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <ForumEtiquetaSelect value={etiquetas} onChange={setEtiquetas} />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <ItemVincularSelect vinculos={vinculos} onChange={setVinculos} />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <ForumFolderSelect value={pastas} onChange={setPastas} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              Anexar imagens ou PDFs (opcional)
            </label>
            {arquivos.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{arquivos.length} arquivo(s)</span>
            )}
          </div>

          {showUpload ? (
            <FileUploadButton
              parentId={tempTopicoId}
              parentType="topico"
              onFileUpload={handleFileUpload}
              disabled={saving}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="w-full rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
            >
              + Adicionar arquivo
            </button>
          )}

          {arquivos.length > 0 && (
            <div className="space-y-2">
              {arquivos.map(arquivo => (
                <ForumFileEmbed
                  key={arquivo.id}
                  id={arquivo.id}
                  nome_original={arquivo.nome_original}
                  tipo_arquivo={arquivo.tipo_arquivo}
                  tamanho_bytes={arquivo.tamanho_bytes}
                  url_publica={arquivo.url_publica}
                  canDelete={true}
                  onDelete={deleteFile}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => router.back()}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Publicar tópico
          </button>
        </div>
      </form>
    </div>
    </div>
  )
}
