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
    const parentId = searchParams.get('parent_id') || null

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
      }) : Promise.resolve([]),
    ])

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

    return NextResponse.json({ pastas, arquivos, breadcrumb })
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

    return NextResponse.json(pasta, { status: 201 })
  } catch (err) {
    console.error('[POST /api/forum/pastas]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}