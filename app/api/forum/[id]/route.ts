import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria } from '@/lib/audit'

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
        arquivos: true, // <-- ADICIONADO: Traz as imagens anexadas no tópico
        comentarios: {
          orderBy: { created_at: 'asc' },
          include: {
            vinculos: true,
            arquivos: true, // <-- ADICIONADO: Traz as imagens anexadas nos comentários
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
    const userName = session.user?.name ?? 'Usuário'
    const perfil = (session.user as any).perfil as string
    const body   = await request.json()

    const topico = await prisma.forum_topicos.findUnique({ where: { id } })
    if (!topico) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    const vinculosAntes = await prisma.forum_vinculos.findMany({ where: { topico_id: id } })
    const arquivosAntes = await prisma.forum_arquivos.findMany({ where: { topico_id: id } })

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
    
    // 1. Lógica existente para Vínculos
    if (Array.isArray(body.vinculos)) {
      await prisma.forum_vinculos.deleteMany({ where: { topico_id: id } })
      if (body.vinculos.length > 0) {
        await prisma.forum_vinculos.createMany({
          data: body.vinculos.map((v: any) => ({
            topico_id:  id,
            tipo_item:  v.tipo_item,
            item_id:    v.item_id,
            item_label: v.item_label,
          })),
        })
      }
    }

    // 2. <-- ADICIONADO: Lógica para Arquivos
    // Se recebeu um array de arquivo_ids (do upload de novas imagens na edição)
    if (Array.isArray(body.arquivo_ids) && body.arquivo_ids.length > 0) {
      await prisma.forum_arquivos.updateMany({
        where: { id: { in: body.arquivo_ids } },
        data: { topico_id: id },
      })
    }

    const topicoAtualizado = await prisma.forum_topicos.findUnique({
      where: { id },
      include: { vinculos: true, arquivos: true },
    })
    const descricao = [
      body.fixado !== undefined && topico.fixado !== body.fixado
        ? (body.fixado ? 'Tópico fixado' : 'Tópico desafixado')
        : null,
      body.fechado !== undefined && topico.fechado !== body.fechado
        ? (body.fechado ? 'Tópico fechado' : 'Tópico reaberto')
        : null,
      body.titulo || body.conteudo || Array.isArray(body.vinculos) || Array.isArray(body.arquivo_ids)
        ? `Tópico "${updated.titulo}" atualizado`
        : null,
    ].filter(Boolean).join(' · ') || `Tópico "${updated.titulo}" atualizado`

    await registrarAuditoria({
      tabela: 'forum_topicos',
      registro_id: id,
      acao: 'UPDATE',
      descricao,
      dados_anteriores: { ...topico, vinculos: vinculosAntes, arquivos: arquivosAntes } as any,
      dados_novos: topicoAtualizado as any,
      usuario_id: userId,
      usuario_nome: userName,
    })

    return NextResponse.json(topicoAtualizado ?? updated)
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
    const userName = session.user?.name ?? 'Usuário'
    const perfil = (session.user as any).perfil as string

    const topico = await prisma.forum_topicos.findUnique({
      where: { id },
      include: {
        vinculos: true,
        arquivos: true,
        comentarios: { include: { vinculos: true, arquivos: true, reacoes: true } },
      },
    })
    if (!topico) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (topico.autor_id !== userId && perfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    await prisma.forum_topicos.delete({ where: { id } })
    await registrarAuditoria({
      tabela: 'forum_topicos',
      registro_id: id,
      acao: 'DELETE',
      descricao: `Tópico "${topico.titulo}" excluído do fórum`,
      dados_anteriores: topico as any,
      usuario_id: userId,
      usuario_nome: userName,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/forum/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
