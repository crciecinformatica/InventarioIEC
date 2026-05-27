import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const userId = (session.user as any).id as string

    const where: any = {}
    if (search) {
      where.OR = [
        { titulo:   { contains: search, mode: 'insensitive' } },
        { conteudo: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (filtro === 'fixados')   where.fixado   = true
    if (filtro === 'meus')      where.autor_id  = userId
    if (filtro === 'vinculados') where.vinculos  = { some: {} }

    const [data, total] = await Promise.all([
      prisma.forum_topicos.findMany({
        where,
        orderBy: [{ fixado: 'desc' }, { created_at: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vinculos: { select: { tipo_item: true, item_id: true, item_label: true } },
          _count: { select: { comentarios: true } },
        },
      }),
      prisma.forum_topicos.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
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
    const { titulo, conteudo, vinculos = [], arquivo_ids = [] } = await request.json()

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
      },
      include: {
        vinculos: true,
        arquivos: true,
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
          _count: { select: { comentarios: true } },
        },
      })
      return NextResponse.json(topicoComArquivos, { status: 201 })
    }

    return NextResponse.json(topico, { status: 201 })
  } catch (err) {
    console.error('[POST /api/forum]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}