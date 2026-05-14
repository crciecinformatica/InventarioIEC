import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const tipoDispositivoRaw = searchParams.get('tipo_dispositivo') || ''
    const tipoMovimentacaoRaw = searchParams.get('tipo_movimentacao') || ''
    const dataInicio = searchParams.get('data_inicio') || ''
    const dataFim = searchParams.get('data_fim') || ''
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : ('desc' as const)

    const where: any = {}
    
    if (search) {
      where.OR = [
        {
          identificador_dispositivo: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          descricao: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (tipoDispositivoRaw !== '') {
      const n = parseInt(tipoDispositivoRaw)
      if (!isNaN(n)) where.tipo_dispositivo = n
    }
    if (tipoMovimentacaoRaw !== '') {
      const n = parseInt(tipoMovimentacaoRaw)
      if (!isNaN(n)) where.tipo_movimentacao = n
    }
    if (dataInicio || dataFim) {
      where.data_movimentacao = {}
      if (dataInicio) where.data_movimentacao.gte = new Date(dataInicio)
      if (dataFim) where.data_movimentacao.lte = new Date(dataFim)
    }
    const validSort: Record<string, boolean> = {
      nome: true, created_at: true, codigo: true, setor: true,
    }
    const safeSort = validSort[sortBy] ? sortBy : 'nome'

    const [data, total] = await Promise.all([
      prisma.movimentacoes.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [safeSort]: sortDir },
        include: { colaborador: { select: { nome: true } } },
      }),
      prisma.movimentacoes.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/movimentacoes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession()
    const body = await request.json()

    const data: any = { ...body }
    if (data.data_movimentacao) {
      data.data_movimentacao = new Date(data.data_movimentacao)
    } else {
      data.data_movimentacao = null
    }

    const item = await prisma.movimentacoes.create({ data })

    await registrarAuditoria({
      tabela: 'movimentacoes',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Movimentação registrada: ${item.identificador_dispositivo ?? item.id}`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/movimentacoes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
