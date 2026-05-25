import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string; cid: string }> }

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { cid } = await params
    const userId  = (session.user as any).id as string
    const perfil  = (session.user as any).perfil as string
    const { conteudo } = await request.json()

    const comentario = await prisma.forum_comentarios.findUnique({ where: { id: cid } })
    if (!comentario) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (comentario.autor_id !== userId && perfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const updated = await prisma.forum_comentarios.update({
      where: { id: cid },
      data: { conteudo: conteudo.trim(), editado: true, updated_at: new Date() },
      include: { vinculos: true, reacoes: { select: { usuario_id: true, tipo: true } } },
    })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { cid }  = await params
    const userId   = (session.user as any).id as string
    const perfil   = (session.user as any).perfil as string

    const comentario = await prisma.forum_comentarios.findUnique({ where: { id: cid } })
    if (!comentario) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (comentario.autor_id !== userId && perfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    await prisma.forum_comentarios.delete({ where: { id: cid } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}