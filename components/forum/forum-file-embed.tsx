'use client'

import { useState, useEffect } from 'react'
import { FileIcon, Trash2, X, Download, ZoomIn } from 'lucide-react'
import { AnimatedDialogFrame } from '@/components/layout/motion-primitives' // Opcional se você quiser usar a sua animação, mas faremos nativo abaixo para garantir

interface ForumFileEmbedProps {
  id: string
  nome_original: string
  tipo_arquivo: string
  tamanho_bytes: number
  url_publica: string
  canDelete?: boolean
  onDelete?: (id: string) => void
}

export function ForumFileEmbed({
  id,
  nome_original,
  tipo_arquivo,
  tamanho_bytes,
  url_publica,
  canDelete,
  onDelete,
}: ForumFileEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isImage = tipo_arquivo.startsWith('image/')

  // Formata o tamanho do arquivo para exibição
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  // Trava o scroll da página quando a imagem estiver em tela cheia
  // e permite fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }

    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  // ==========================================
  // RENDERIZAÇÃO PARA IMAGENS
  // ==========================================
  if (isImage) {
    return (
      <>
        {/* Miniatura no Fórum */}
        <div className="relative group inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 max-w-full">
          <img 
            src={url_publica} 
            alt={nome_original} 
            onClick={() => setIsFullscreen(true)}
            // Limitamos a altura para não poluir a tela, mas mantemos a proporção
            className="max-h-52 w-auto max-w-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
          />
          
          {/* Botões de Ação que aparecem no Hover */}
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <a 
              href={url_publica} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition"
              title="Abrir original / Baixar"
            >
              <Download className="w-4 h-4" />
            </a>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(id)}
                className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition"
                title="Excluir imagem"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Tarja com o nome na parte inferior (aparece no Hover) */}
          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <p className="text-xs text-white truncate drop-shadow-md font-medium">
              {nome_original} <span className="opacity-80 font-normal">({formatFileSize(tamanho_bytes)})</span>
            </p>
          </div>
        </div>

        {/* Modal Fullscreen (Lightbox) */}
        {isFullscreen && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsFullscreen(false)} // Fecha ao clicar fora
          >
            {/* Toolbar superior do Modal */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
              <p className="text-white text-sm font-medium drop-shadow-md truncate max-w-[70%]">
                {nome_original}
              </p>
              <div className="flex items-center gap-3">
                <a 
                  href={url_publica} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition p-2 bg-white/10 hover:bg-white/20 rounded-full"
                  onClick={(e) => e.stopPropagation()} // Evita fechar o modal ao clicar em baixar
                  title="Abrir em nova guia"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="text-white/80 hover:text-white transition p-2 bg-white/10 hover:bg-white/20 rounded-full"
                  title="Fechar (Esc)"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Imagem em tamanho real (Maximizada) */}
            <img 
              src={url_publica} 
              alt={nome_original} 
              className="max-w-full max-h-full object-contain drop-shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()} // Evita fechar se clicar na imagem em si
            />
          </div>
        )}
      </>
    )
  }

  // ==========================================
  // RENDERIZAÇÃO PARA ARQUIVOS (PDF, DOCX, etc)
  // ==========================================
  return (
    <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
          <FileIcon className="w-5 h-5" />
        </div>
        
        <div className="min-w-0">
          <a 
            href={url_publica} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 truncate block transition"
          >
            {nome_original}
          </a>
          <p className="text-xs text-slate-500">{formatFileSize(tamanho_bytes)}</p>
        </div>
      </div>

      <div className="flex gap-1 shrink-0 ml-3">
        <a 
          href={url_publica} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
          title="Baixar arquivo"
        >
          <Download className="w-4 h-4" />
        </a>
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
            title="Excluir arquivo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}