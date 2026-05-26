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

    const userId = (session.user as any).id as string
    const { comentario_id, tipo } = await request.json()

    if (!['util', 'resolveu'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    // Toggle: se já existe remove, senão cria
    const existe = await prisma.forum_reacoes.findUnique({
      where: { comentario_id_usuario_id_tipo: { comentario_id, usuario_id: userId, tipo } },
    })

    if (existe) {
      await prisma.forum_reacoes.delete({ where: { id: existe.id } })
      return NextResponse.json({ acao: 'removida' })
    }

    await prisma.forum_reacoes.create({ data: { comentario_id, usuario_id: userId, tipo } })
    return NextResponse.json({ acao: 'adicionada' })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}