import { NextResponse } from 'next/server'
import { isSnowIntegrationAuthorized } from '@/lib/snow/auth'
import { processSnowWorkbook } from '@/lib/snow/service'
import { SnowProcessingError } from '@/lib/snow/types'

export const runtime = 'nodejs'
export const maxDuration = 60
const SNOW_DEFAULT_ORIGEM_EMAIL = 'smcgti.snow@pucminas.br'

function isXlsxFile(file: File) {
  return file.name.toLowerCase().endsWith('.xlsx')
}

export async function POST(request: Request) {
  if (!isSnowIntegrationAuthorized(request)) {
    return NextResponse.json({ error: 'Token de integração SNOW inválido' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo .xlsx obrigatório' }, { status: 400 })
    }

    if (!isXlsxFile(file)) {
      return NextResponse.json({ error: 'Extensão inválida. Envie um arquivo .xlsx' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await processSnowWorkbook(buffer, {
      nomeArquivo: file.name,
      origemEmail: String(formData.get('origem_email') ?? '') || SNOW_DEFAULT_ORIGEM_EMAIL,
      assuntoEmail: String(formData.get('assunto_email') ?? '') || null,
      recebidoEm: new Date(),
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof SnowProcessingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('[POST /api/snow/processar-xlsx]', error)
    return NextResponse.json({ error: 'Erro interno ao processar relatório SNOW' }, { status: 500 })
  }
}
