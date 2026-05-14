import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search  = searchParams.get('search') || ''
    const ativo   = searchParams.get('ativo')  || ''
    const all     = searchParams.get('all')    === 'true'
    const page    = parseInt(searchParams.get('page')  || '1')
    const limit   = parseInt(searchParams.get('limit') || '50')

    const where: Prisma.setoresWhereInput = {}
    if (search) where.nome = { contains: search, mode: 'insensitive' }
    if (ativo !== '') where.ativo = ativo === 'true'

    if (all) {
      const data = await prisma.setores.findMany({
        where,
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      })
      return NextResponse.json(data)
    }

    const [data, total] = await Promise.all([
      prisma.setores.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nome: 'asc' },
        include: {
          _count: {
            select: {
              colaboradores: true,
              maquinas: true,
              notebooks: true,
              aparelhos: true,
              impressoras: true,
              ramais: true,
              racks: true,
            },
          },
        },
      }),
      prisma.setores.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('[GET /api/setores]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession()
    const { nome, descricao } = await request.json()

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const existe = await prisma.setores.findUnique({ where: { nome: nome.trim() } })
    if (existe) return NextResponse.json({ error: 'Setor já cadastrado' }, { status: 409 })

    const item = await prisma.setores.create({
      data: {
        nome: nome.trim(),
        descricao: descricao || null,
        ativo: true,
      },
    })

    await registrarAuditoria({
      tabela: 'setores', registro_id: item.id, acao: 'CREATE',
      descricao: `Setor "${item.nome}" criado`,
      dados_novos: item, usuario_id, usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error('[POST /api/setores]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
