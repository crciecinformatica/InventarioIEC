'use client'

import { useRef, useState } from 'react'
import { FileIcon, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadButtonProps {
  onFileUpload: (file: {
    id: string
    nome_original: string
    tipo_arquivo: string
    tamanho_bytes: number
    url_publica: string
  }) => void
  parentId: string
  parentType: 'topico' | 'comentario'
  disabled?: boolean
}

type PreviewFile = { id: string; file: File; url: string }

const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']

export function FileUploadButton({ onFileUpload, parentId, parentType, disabled = false }: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previews, setPreviews] = useState<PreviewFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    const valid: PreviewFile[] = []

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: tipo não permitido. Use JPEG, PNG ou PDF.`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: arquivo maior que 10MB.`)
        continue
      }
      valid.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      })
    }

    if (valid.length > 0) setPreviews(current => [...current, ...valid])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append(parentType === 'topico' ? 'topico_id' : 'comentario_id', parentId)

    const res = await fetch('/api/forum/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || `Erro ao enviar ${file.name}`)
    }

    return res.json()
  }

  async function uploadAll() {
    if (previews.length === 0) return
    setIsUploading(true)
    let uploaded = 0
    try {
      for (const preview of previews) {
        const uploadedFile = await uploadFile(preview.file)
        onFileUpload(uploadedFile)
        uploaded += 1
      }
      toast.success(`${uploaded} arquivo(s) enviado(s) com sucesso!`)
      previews.forEach(preview => {
        if (preview.url) URL.revokeObjectURL(preview.url)
      })
      setPreviews([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload dos arquivos')
    } finally {
      setIsUploading(false)
    }
  }

  function removePreview(id: string) {
    setPreviews(current => {
      const removed = current.find(item => item.id === id)
      if (removed?.url) URL.revokeObjectURL(removed.url)
      return current.filter(item => item.id !== id)
    })
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled || isUploading) return
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    if (e.type === 'dragleave') setDragActive(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled || isUploading) return
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`rounded-xl border border-dashed p-4 text-center transition ${
          dragActive
            ? 'border-blue-500 bg-blue-950/30'
            : 'border-slate-700 bg-slate-950/50 hover:border-slate-600'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          multiple
          onChange={event => event.target.files && addFiles(event.target.files)}
          disabled={disabled || isUploading}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImageIcon className="mx-auto mb-2 h-6 w-6 text-slate-500" />
          <p className="text-sm font-semibold text-slate-200">Clique ou arraste arquivos aqui</p>
          <p className="mt-1 text-xs text-slate-500">JPEG, PNG ou PDF, até 10MB cada</p>
        </button>
      </div>

      {previews.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{previews.length} arquivo(s) na fila</p>
            <button
              type="button"
              onClick={uploadAll}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {isUploading ? 'Enviando...' : 'Enviar fila'}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {previews.map(preview => (
              <div key={preview.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                {preview.url ? (
                  <img src={preview.url} alt="" className="h-12 w-12 rounded-md object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-800 text-slate-400">
                    <FileIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{preview.file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(preview.file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removePreview(preview.id)}
                  disabled={isUploading}
                  className="rounded-md p-1 text-slate-500 transition hover:bg-red-950 hover:text-red-300 disabled:opacity-40"
                  title="Remover da fila"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
