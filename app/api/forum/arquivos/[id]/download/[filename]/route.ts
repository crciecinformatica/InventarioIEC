import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createArquivoDownloadResponse } from '../../../download-response'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string; filename: string }> }

export async function GET(_: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const arquivo = await prisma.forum_arquivos.findUnique({ where: { id } })
    if (!arquivo) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    return createArquivoDownloadResponse(arquivo)
  } catch (err) {
    console.error('[GET /api/forum/arquivos/[id]/download/[filename]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
