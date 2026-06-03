import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria } from '@/lib/audit'
import { FORUM_ETIQUETAS, normalizeForumEtiquetas } from '@/lib/forum'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit  = parseInt(searchParams.get('limit') || '20', 10)
    const search = (searchParams.get('search') || '').trim()
    const filtro = searchParams.get('filtro') || 'todos' // todos | fixados | meus | vinculados
    const etiqueta = searchParams.get('etiqueta') || ''

    const userId = (session.user as any).id as string

    const baseWhere: any = {}
    if (search) {
      baseWhere.OR = [
        { titulo:   { contains: search, mode: 'insensitive' } },
        { conteudo: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (filtro === 'fixados')   baseWhere.fixado   = true
    if (filtro === 'meus')      baseWhere.autor_id  = userId
    if (filtro === 'vinculados') baseWhere.vinculos  = { some: {} }
    const where: any = { ...baseWhere }
    if (FORUM_ETIQUETAS.includes(etiqueta as any)) {
      where.etiquetas = { some: { etiqueta } }
    }

    const [data, total, allCount, etiquetaGroups] = await Promise.all([
      prisma.forum_topicos.findMany({
        where,
        orderBy: [{ fixado: 'desc' }, { created_at: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vinculos: { select: { tipo_item: true, item_id: true, item_label: true } },
          arquivos: { select: { id: true, nome_original: true, tipo_arquivo: true, tamanho_bytes: true, url_publica: true } },
          pastas: {
            include: {
              pasta: {
                include: { _count: { select: { arquivos: true, filhos: true } } },
              },
            },
          },
          etiquetas: { select: { etiqueta: true } },
          comentarios: {
            orderBy: { created_at: 'desc' },
            take: 2,
            select: { id: true, autor_nome: true, conteudo: true, tipo: true, created_at: true },
          },
          _count: { select: { comentarios: true, arquivos: true } },
        },
      }),
      prisma.forum_topicos.count({ where }),
      prisma.forum_topicos.count({ where: baseWhere }),
      prisma.forum_topico_etiquetas.groupBy({
        by: ['etiqueta'],
        where: { topico: baseWhere },
        _count: { etiqueta: true },
      }),
    ])
    const counts = {
      all: allCount,
      etiquetas: Object.fromEntries(etiquetaGroups.map(item => [item.etiqueta, item._count.etiqueta])),
    }

    return NextResponse.json({ data, total, counts, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('[GET /api/forum]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const userId   = (session.user as any).id as string
    const userName = session.user?.name ?? 'Usuário'
    const { titulo, conteudo, vinculos = [], arquivo_ids = [], pasta_ids = [], etiquetas } = await request.json()
    const safeEtiquetas = normalizeForumEtiquetas(etiquetas)
    const safePastaIds = Array.isArray(pasta_ids)
      ? Array.from(new Set(pasta_ids.filter((id: unknown): id is string => typeof id === 'string' && Boolean(id))))
      : []

    if (!titulo?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
    if (!conteudo?.trim()) return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 })

    const topico = await prisma.forum_topicos.create({
      data: {
        titulo:    titulo.trim(),
        conteudo:  conteudo.trim(),
        autor_id:  userId,
        autor_nome: userName,
        vinculos: vinculos.length > 0 ? {
          create: vinculos.map((v: any) => ({
            tipo_item:  v.tipo_item,
            item_id:    v.item_id,
            item_label: v.item_label,
          })),
        } : undefined,
        etiquetas: {
          create: safeEtiquetas.map(etiqueta => ({ etiqueta })),
        },
        pastas: safePastaIds.length > 0 ? {
          create: safePastaIds.map(pasta_id => ({ pasta_id })),
        } : undefined,
      },
      include: {
        vinculos: true,
        arquivos: true,
        pastas: { include: { pasta: { include: { _count: { select: { arquivos: true, filhos: true } } } } } },
        etiquetas: true,
        _count: { select: { comentarios: true } },
      },
    })

    // Associar arquivos ao tópico se houver
    if (arquivo_ids.length > 0) {
      await prisma.forum_arquivos.updateMany({
        where: { id: { in: arquivo_ids } },
        data: { topico_id: topico.id },
      })
      // Recarregar com arquivos
      const topicoComArquivos = await prisma.forum_topicos.findUnique({
        where: { id: topico.id },
        include: {
          vinculos: true,
          arquivos: true,
          pastas: { include: { pasta: { include: { _count: { select: { arquivos: true, filhos: true } } } } } },
          etiquetas: true,
          _count: { select: { comentarios: true } },
        },
      })
      await registrarAuditoria({
        tabela: 'forum_topicos',
        registro_id: topico.id,
        acao: 'CREATE',
        descricao: `Tópico "${topico.titulo}" criado no fórum`,
        dados_novos: topicoComArquivos as any,
        usuario_id: userId,
        usuario_nome: userName,
      })
      return NextResponse.json(topicoComArquivos, { status: 201 })
    }

    await registrarAuditoria({
      tabela: 'forum_topicos',
      registro_id: topico.id,
      acao: 'CREATE',
      descricao: `Tópico "${topico.titulo}" criado no fórum`,
      dados_novos: topico as any,
      usuario_id: userId,
      usuario_nome: userName,
    })

    return NextResponse.json(topico, { status: 201 })
  } catch (err) {
    console.error('[POST /api/forum]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
