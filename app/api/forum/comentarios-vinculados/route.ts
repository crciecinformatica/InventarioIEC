import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipoItem = searchParams.get('tipo_item') || ''
  const itemId = searchParams.get('item_id') || ''
  if (!tipoItem || !itemId) return NextResponse.json({ data: [] })

  const now = new Date()
  const vinculos = await prisma.forum_vinculos.findMany({
    where: {
      tipo_item: tipoItem,
      item_id: itemId,
      comentario_id: { not: null },
      comentario: {
        OR: [
          { tipo: 'permanente' },
          { tipo: 'temporario', expira_em: { gt: now } },
        ],
      },
    },
    include: {
      comentario: {
        include: {
          topico: { select: { id: true, titulo: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: 20,
  })

  const data = vinculos
    .map(vinculo => vinculo.comentario)
    .filter(Boolean)
    .map(comentario => ({
      id: comentario!.id,
      topico_id: comentario!.topico_id,
      topico_titulo: comentario!.topico.titulo,
      autor_nome: comentario!.autor_nome,
      conteudo: comentario!.conteudo,
      tipo: comentario!.tipo,
      expira_em: comentario!.expira_em,
      created_at: comentario!.created_at,
    }))

  return NextResponse.json({ data })
}
