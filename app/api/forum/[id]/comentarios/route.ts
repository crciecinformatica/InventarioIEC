import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id: topico_id } = await params
    const userId   = (session.user as any).id as string
    const userName = session.user?.name ?? 'Usuário'
    const { conteudo, vinculos = [] } = await request.json()

    if (!conteudo?.trim()) return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 })

    const topico = await prisma.forum_topicos.findUnique({ where: { id: topico_id } })
    if (!topico)  return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })
    if (topico.fechado) return NextResponse.json({ error: 'Tópico fechado' }, { status: 403 })

    const comentario = await prisma.forum_comentarios.create({
      data: {
        topico_id,
        autor_id:   userId,
        autor_nome: userName,
        conteudo:   conteudo.trim(),
        vinculos: vinculos.length > 0 ? {
          create: vinculos.map((v: any) => ({
            tipo_item:  v.tipo_item,
            item_id:    v.item_id,
            item_label: v.item_label,
          })),
        } : undefined,
      },
      include: {
        vinculos: true,
        reacoes:  { select: { usuario_id: true, tipo: true } },
      },
    })

    return NextResponse.json(comentario, { status: 201 })
  } catch (err) {
    console.error('[POST /api/forum/[id]/comentarios]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}