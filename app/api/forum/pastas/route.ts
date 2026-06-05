import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria } from '@/lib/audit'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id') || null
    const flat = searchParams.get('flat') === '1'
    const search = (searchParams.get('search') || '').trim()

    if (flat) {
      const pastas = await prisma.forum_pastas.findMany({
        where: search
          ? { nome: { contains: search, mode: 'insensitive' } }
          : undefined,
        orderBy: [{ parent_id: 'asc' }, { nome: 'asc' }],
        take: 80,
        include: {
          parent: { select: { id: true, nome: true, parent_id: true } },
          _count: { select: { filhos: true, arquivos: true } },
        },
      })

      return NextResponse.json({
        pastas: pastas.map(pasta => ({
          ...pasta,
          caminho: pasta.parent ? `${pasta.parent.nome} / ${pasta.nome}` : pasta.nome,
        })),
      })
    }

    const [pastas, arquivos] = await Promise.all([
      prisma.forum_pastas.findMany({
        where: { parent_id: parentId },
        orderBy: { nome: 'asc' },
        include: {
          _count: { select: { filhos: true, arquivos: true } },
        },
      }),
      parentId ? prisma.forum_arquivos.findMany({
        where: { pasta_id: parentId },
        orderBy: { created_at: 'desc' },
        include: {
          usuario: { select: { nome: true } },
        },
      }) : Promise.resolve([]),
    ])

    const arquivosComAutoria = arquivos.map(arquivo => ({
      ...arquivo,
      enviado_por_nome: arquivo.usuario?.nome?.trim() || 'Usuário removido',
    }))

    // Breadcrumb — montar trilha até a raiz
    const breadcrumb: any[] = []
    if (parentId) {
      let current: any = await prisma.forum_pastas.findUnique({ where: { id: parentId } })
      while (current) {
        breadcrumb.unshift({ id: current.id, nome: current.nome })
        current = current.parent_id
          ? await prisma.forum_pastas.findUnique({ where: { id: current.parent_id } })
          : null
      }
    }

    return NextResponse.json({ pastas, arquivos: arquivosComAutoria, breadcrumb })
  } catch (err) {
    console.error('[GET /api/forum/pastas]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const userId = (session.user as any).id as string
    const userName = session.user?.name ?? 'Usuário'
    const { nome, descricao, parent_id, cor } = await request.json()

    if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

    const pasta = await prisma.forum_pastas.create({
      data: {
        nome:      nome.trim(),
        descricao: descricao || null,
        parent_id: parent_id || null,
        criado_por: userId,
        cor:       cor || '#3b82f6',
      },
    })

    await registrarAuditoria({
      tabela: 'forum_pastas',
      registro_id: pasta.id,
      acao: 'CREATE',
      descricao: `Pasta "${pasta.nome}" criada em documentos do fórum`,
      dados_novos: pasta as any,
      usuario_id: userId,
      usuario_nome: userName,
    })

    return NextResponse.json(pasta, { status: 201 })
  } catch (err) {
    console.error('[POST /api/forum/pastas]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
