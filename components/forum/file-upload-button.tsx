'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileIcon, Image as ImageIcon, Loader2 } from 'lucide-react'
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

export function FileUploadButton({ onFileUpload, parentId, parentType, disabled = false }: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isImage = (mimeType: string) => mimeType.startsWith('image/')
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  async function uploadFile(file: File) {
    // Validação
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPEG, PNG ou PDF.')
      setPreview(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB.')
      setPreview(null)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append(parentType === 'topico' ? 'topico_id' : 'comentario_id', parentId)

      const res = await fetch('/api/forum/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const uploadedFile = await res.json()
      toast.success('Arquivo enviado com sucesso!')
      onFileUpload(uploadedFile)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload do arquivo')
    } finally {
      setIsUploading(false)
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (preview) setPreview(null)
      
      if (isImage(file.type)) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setPreview({ file, url: event.target?.result as string })
        }
        reader.readAsDataURL(file)
      } else {
        setPreview({ file, url: '' })
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      if (preview) setPreview(null)

      if (isImage(file.type)) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setPreview({ file, url: event.target?.result as string })
        }
        reader.readAsDataURL(file)
      } else {
        setPreview({ file, url: '' })
      }
    }
  }

  if (preview?.file) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          {preview.url ? (
            <img src={preview.url} alt="preview" className="w-16 h-16 object-cover rounded" />
          ) : (
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
              <FileIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{preview.file.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatFileSize(preview.file.size)} • {preview.file.type.split('/')[1]?.toUpperCase() || 'unknown'}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPreview(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              disabled={isUploading}
              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition"
              title="Descartar"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => uploadFile(preview.file)}
              disabled={isUploading}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition"
            >
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {isUploading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
        dragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-400" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Clique ou arraste arquivos aqui
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          JPEG, PNG ou PDF (máx. 10MB)
        </p>
      </button>
    </div>
  )
}
