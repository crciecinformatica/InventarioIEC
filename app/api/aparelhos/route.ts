import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'
import { withLocalidadePadrao } from '@/lib/localidades'
import { withoutLegacyVirtualFields } from '@/lib/payload'

export const runtime = 'nodejs'

function parseSetorIds(value: string) {
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1', 10))
    const limit   = Math.max(1, Math.min(10000, parseInt(searchParams.get('limit') || '20', 10)))
    const search  = (searchParams.get('search') || '').trim()
    const setorId = searchParams.get('setor_id') || ''
    const setorIds = parseSetorIds(setorId)
    const localidadeId = searchParams.get('localidade_id') || ''
    const localidadeIds = parseSetorIds(localidadeId)
    const status  = searchParams.get('status')   || ''
    const chip    = searchParams.get('chip')     || ''
    const alocacao= searchParams.get('alocacao') || ''
    const sort    = searchParams.get('sort')     || 'modelo'
    const dir     = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    const validSortFields: Record<string, boolean> = {
      modelo: true, tipo: true, created_at: true,
    }
    const safeSort = validSortFields[sort] ? sort : 'modelo'

    const AND: any[] = []

    if (search) {
      AND.push({
        OR: [
          { modelo:      { contains: search, mode: 'insensitive' } },
          { endereco_ip: { contains: search, mode: 'insensitive' } },
          { setor_rel: { nome: { contains: search, mode: 'insensitive' } } },
          { localidade_rel: { nome: { contains: search, mode: 'insensitive' } } },
          {
            alocacoes: {
              some: {
                ativo: true,
                colaborador: { nome: { contains: search, mode: 'insensitive' } },
              },
            },
          },
        ],
      })
    }

    if (setorIds.length === 1) AND.push({ setor_id: setorIds[0] })
    if (setorIds.length > 1) AND.push({ setor_id: { in: setorIds } })
    if (localidadeIds.length === 1) AND.push({ localidade_id: localidadeIds[0] })
    if (localidadeIds.length > 1) AND.push({ localidade_id: { in: localidadeIds } })
    if (status !== '') AND.push({ status: status === 'true' })
    if (chip   !== '') AND.push({ chip:   chip   === 'true' })

    if (alocacao === 'alocado') {
      AND.push({ alocacoes: { some: { ativo: true, aparelho_id: { not: null } } } })
    } else if (alocacao === 'livre') {
      AND.push({ alocacoes: { none: { ativo: true, aparelho_id: { not: null } } } })
    }

    const where: any = AND.length > 0 ? { AND } : {}
    const orderBy = { [safeSort]: dir }

    const [data, total] = await Promise.all([
      prisma.aparelhos.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          alocacoes: {
            where: { ativo: true },
            include: { colaborador: { select: { nome: true, setor_rel: {select: {nome: true } } } } },
            orderBy: { data_inicio: 'asc' },
          },
          setor_rel: { select: { id: true, nome: true } },
          localidade_rel: { select: { id: true, nome: true } },
        },
      }),
      prisma.aparelhos.count({ where }),
    ])

    const mapped = data.map((a: any) => ({
      ...a,
      setor_nome: a.setor_rel?.nome ?? null,
      localidade_nome: a.localidade_rel?.nome ?? null,
      alocacoes_ativas: a.alocacoes.map((al: any) => ({
        id: al.id,
        colaborador: al.colaborador,
        descricao_alocacao: al.descricao_alocacao,
        motivo_alocacao: al.motivo_alocacao,
        data_inicio: al.data_inicio,
        setor: al.colaborador.setor_rel?.nome ?? null,
      })),
      alocacao_ativa: a.alocacoes[0]
        ? {
            colaborador: a.alocacoes[0].colaborador,
            descricao_alocacao: a.alocacoes[0].descricao_alocacao,
            motivo_alocacao: a.alocacoes[0].motivo_alocacao,
            data_inicio: a.alocacoes[0].data_inicio,
            setor: a.alocacoes[0].colaborador.setor_rel?.nome ?? null,
          }
        : null,
      alocacoes: undefined,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/aparelhos]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession()
    const body = await request.json()
    const data = await withLocalidadePadrao(withoutLegacyVirtualFields(body))
    const item = await prisma.aparelhos.create({ data })

    await registrarAuditoria({
      tabela: 'aparelhos',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Aparelho "${item.modelo ?? item.id}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/aparelhos]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
