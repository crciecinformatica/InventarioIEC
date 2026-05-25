import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    const topico = await prisma.forum_topicos.findUnique({
      where: { id },
      include: {
        vinculos: true,
        comentarios: {
          orderBy: { created_at: 'asc' },
          include: {
            vinculos: true,
            reacoes:  { select: { usuario_id: true, tipo: true } },
          },
        },
      },
    })

    if (!topico) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json(topico)
  } catch (err) {
    console.error('[GET /api/forum/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const userId = (session.user as any).id as string
    const perfil = (session.user as any).perfil as string
    const body   = await request.json()

    const topico = await prisma.forum_topicos.findUnique({ where: { id } })
    if (!topico) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    // Só autor ou admin pode editar título/conteúdo
    const isAdmin  = perfil === 'admin'
    const isAutor  = topico.autor_id === userId

    const data: any = {}
    if ((isAutor || isAdmin) && body.titulo)   data.titulo   = body.titulo.trim()
    if ((isAutor || isAdmin) && body.conteudo) data.conteudo = body.conteudo.trim()
    // Só admin pode fixar/fechar
    if (isAdmin && body.fixado  !== undefined) data.fixado  = body.fixado
    if (isAdmin && body.fechado !== undefined) data.fechado = body.fechado
    data.updated_at = new Date()

    const updated = await prisma.forum_topicos.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/forum/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const userId = (session.user as any).id as string
    const perfil = (session.user as any).perfil as string

    const topico = await prisma.forum_topicos.findUnique({ where: { id } })
    if (!topico) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (topico.autor_id !== userId && perfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    await prisma.forum_topicos.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/forum/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}