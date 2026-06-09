import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const item = await prisma.solicitacoes_snow.findUnique({
      where: { id },
      include: {
        itens: {
          orderBy: { criado_em: 'asc' },
          include: {
            maquina: {
              select: {
                id: true,
                nome_host: true,
                endereco_ip: true,
                identificador: true,
              },
            },
          },
        },
      },
    })

    if (!item) return NextResponse.json({ error: 'Solicitação SNOW não encontrada' }, { status: 404 })

    return NextResponse.json(item)
  } catch (error) {
    console.error('[GET /api/snow/solicitacoes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
