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
    const statusRaw = searchParams.get('status') || ''
    const prioridadeRaw = searchParams.get('prioridade') || ''
    const tipoSolicitacaoRaw = searchParams.get('tipo_solicitacao') || ''
    const dataInicio = searchParams.get('data_inicio') || ''
    const dataFim = searchParams.get('data_fim') || ''
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : ('desc' as const)

    const where: any = {}
    if (statusRaw !== '') {
      const n = parseInt(statusRaw)
      if (!isNaN(n)) where.status_solicitacao = n
    }
    if (prioridadeRaw !== '') {
      const n = parseInt(prioridadeRaw)
      if (!isNaN(n)) where.prioridade = n
    }
    if (tipoSolicitacaoRaw !== '') {
      const n = parseInt(tipoSolicitacaoRaw)
      if (!isNaN(n)) where.tipo_solicitacao = n
    }
    if (dataInicio || dataFim) {
      where.data_criacao = {}
      if (dataInicio) where.data_criacao.gte = new Date(dataInicio)
      if (dataFim) where.data_criacao.lte = new Date(dataFim)
    }
    const validSort: Record<string, boolean> = {
      nome: true, created_at: true, codigo: true,
    }
    const safeSort = validSort[sortBy] ? sortBy : 'nome'
    const [data, total] = await Promise.all([
      prisma.solicitacoes.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [safeSort]: sortDir },
      }),
      prisma.solicitacoes.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/solicitacoes]', error)
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
    if (data.data_criacao) {
      data.data_criacao = new Date(data.data_criacao)
    } else {
      data.data_criacao = null
    }

    const item = await prisma.solicitacoes.create({ data })

    await registrarAuditoria({
      tabela: 'solicitacoes',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Solicitação criada por "${item.solicitante ?? 'desconhecido'}"`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/solicitacoes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}