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
    const userId   = (session.user as any).id as string
    const userName = session.user?.name ?? 'Usuário'
    
    // CORREÇÃO: Extrair todos os campos em uma única chamada
    const { conteudo, vinculos = [], arquivo_ids = [] } = await request.json()

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

    // NOVA LÓGICA: Vincula as imagens ao ID do comentário recém-criado
    if (Array.isArray(arquivo_ids) && arquivo_ids.length > 0) {
      await prisma.forum_arquivos.updateMany({
        where: { id: { in: arquivo_ids } },
        data: { comentario_id: comentario.id },
      })
    }

    const comentarioCompleto = await prisma.forum_comentarios.findUnique({
      where: { id: comentario.id },
      include: {
        vinculos: true,
        arquivos: true,
        reacoes: { select: { usuario_id: true, tipo: true } },
      },
    })

    await registrarAuditoria({
      tabela: 'forum_comentarios',
      registro_id: comentario.id,
      acao: 'CREATE',
      descricao: `Comentário criado no tópico "${topico.titulo}"`,
      dados_novos: comentarioCompleto as any,
      usuario_id: userId,
      usuario_nome: userName,
    })

    return NextResponse.json(comentarioCompleto ?? comentario, { status: 201 })
  } catch (err) {
    console.error('[POST /api/forum/[id]/comentarios]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
