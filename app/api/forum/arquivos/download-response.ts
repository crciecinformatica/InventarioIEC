import { NextResponse } from 'next/server'

type ArquivoDownload = {
  nome_original: string
  tipo_arquivo: string
  tamanho_bytes: number
  url_publica: string
}

type ContentDispositionType = 'attachment' | 'inline'

function sanitizeDownloadName(fileName: string) {
  const sanitized = fileName
    .replace(/[/\\]/g, '_')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()

  return sanitized || 'arquivo'
}

function contentDisposition(fileName: string, disposition: ContentDispositionType) {
  const safeName = sanitizeDownloadName(fileName)
  const asciiName = safeName
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/["\\]/g, '_')

  return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
}

export async function createArquivoResponse(
  arquivo: ArquivoDownload,
  disposition: ContentDispositionType
) {
  const storageResponse = await fetch(arquivo.url_publica, { cache: 'no-store' })

  if (!storageResponse.ok || !storageResponse.body) {
    return NextResponse.json({ error: 'Arquivo não encontrado no storage' }, { status: 404 })
  }

  const headers = new Headers({
    'Content-Disposition': contentDisposition(arquivo.nome_original, disposition),
    'Content-Type': arquivo.tipo_arquivo || storageResponse.headers.get('content-type') || 'application/octet-stream',
    'Cache-Control': 'private, max-age=0, must-revalidate',
  })

  const contentLength = storageResponse.headers.get('content-length') || String(arquivo.tamanho_bytes || '')
  if (contentLength) headers.set('Content-Length', contentLength)

  return new NextResponse(storageResponse.body, { status: 200, headers })
}

export async function createArquivoDownloadResponse(arquivo: ArquivoDownload) {
  return createArquivoResponse(arquivo, 'attachment')
}

export async function createArquivoPreviewResponse(arquivo: ArquivoDownload) {
  return createArquivoResponse(arquivo, 'inline')
}
