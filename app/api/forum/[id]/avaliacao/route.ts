import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id: topico_id } = await params
    const userId = (session.user as any).id as string
    const userName = session.user?.name ?? 'Usuário'
    const { tipo } = await request.json()

    if (tipo !== 'aprovado' && tipo !== 'reprovado') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const topico = await prisma.forum_topicos.findUnique({
      where: { id: topico_id },
      select: { id: true, titulo: true },
    })
    if (!topico) return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })

    const atual = await prisma.forum_topico_avaliacoes.findUnique({
      where: { topico_id_usuario_id: { topico_id, usuario_id: userId } },
    })

    let acao: 'removida' | 'criada' | 'alterada'
    if (atual) {
      if (atual.tipo === tipo) {
        await prisma.forum_topico_avaliacoes.delete({ where: { id: atual.id } })
        acao = 'removida'
      } else {
        await prisma.forum_topico_avaliacoes.update({
          where: { id: atual.id },
          data: { tipo, updated_at: new Date() },
        })
        acao = 'alterada'
      }
    } else {
      await prisma.forum_topico_avaliacoes.create({
        data: { topico_id, usuario_id: userId, tipo },
      })
      acao = 'criada'
    }

    const avaliacoes = await prisma.forum_topico_avaliacoes.findMany({
      where: { topico_id },
      select: { usuario_id: true, tipo: true },
    })

    await registrarAuditoria({
      tabela: 'forum_topicos',
      registro_id: topico_id,
      acao: 'UPDATE',
      descricao: `Avaliação "${tipo}" ${acao} no tópico "${topico.titulo}"`,
      dados_novos: { avaliacoes } as any,
      usuario_id: userId,
      usuario_nome: userName,
    })

    return NextResponse.json({ acao, avaliacoes })
  } catch (err) {
    console.error('[POST /api/forum/[id]/avaliacao]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
