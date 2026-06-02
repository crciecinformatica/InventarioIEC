import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, requireAdmin } from '@/lib/auth'
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
    const page      = Math.max(1, parseInt(searchParams.get('page')  || '1', 10))
    const limit     = Math.max(1, Math.min(10000, parseInt(searchParams.get('limit') || '20', 10)))
    const search    = (searchParams.get('search')    || '').trim()
    const setorId   = searchParams.get('setor_id')   || ''
    const setorIds  = parseSetorIds(setorId)
    const localidadeId = searchParams.get('localidade_id') || ''
    const localidadeIds = parseSetorIds(localidadeId)
    const categoria = searchParams.get('categoria')  || ''
    const fabricante= searchParams.get('fabricante') || ''
    const alocacao  = searchParams.get('alocacao')   || ''
    const sort      = searchParams.get('sort')       || 'modelo'
    const dir       = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    const validSortFields: Record<string, boolean> = {
      modelo: true, fabricante: true, numero_patrimonio: true,
      created_at: true,
    }
    const safeSort = validSortFields[sort] ? sort : 'modelo'

    const AND: any[] = []

    if (search) {
      AND.push({
        OR: [
          { modelo:           { contains: search, mode: 'insensitive' } },
          { fabricante:       { contains: search, mode: 'insensitive' } },
          { numero_patrimonio:{ contains: search, mode: 'insensitive' } },
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

    if (setorIds.length > 0) {
      const setorFilter = setorIds.length === 1 ? setorIds[0] : { in: setorIds }
      AND.push({
        OR: [
          { setor_id: setorFilter },
          { emprestado_setor_id: setorFilter },
          { emprestado_colaborador: { is: { setor_id: setorFilter } } },
          {
            alocacoes: {
              some: {
                ativo: true,
                colaborador: { setor_id: setorFilter },
              },
            },
          },
        ],
      })
    }
    if (localidadeIds.length === 1) AND.push({ localidade_id: localidadeIds[0] })
    if (localidadeIds.length > 1) AND.push({ localidade_id: { in: localidadeIds } })
    if (categoria) AND.push({ categoria })
    if (fabricante) AND.push({ fabricante: { contains: fabricante, mode: 'insensitive' } })

    if (alocacao === 'alocado') {
      AND.push({
        OR: [
          { emprestado: true },
          { alocacoes: { some: { ativo: true, notebook_id: { not: null } } } },
        ],
      })
    } else if (alocacao === 'livre') {
      AND.push({
        emprestado: false,
        alocacoes: { none: { ativo: true, notebook_id: { not: null } } },
      })
    }

    const where: any = AND.length > 0 ? { AND } : {}
    const orderBy = { [safeSort]: dir }

    const [data, total] = await Promise.all([
      prisma.notebooks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          alocacoes: {
            where: { ativo: true },
            include: { colaborador: { select: { id: true, nome: true, setor_rel: {select: {nome: true } } } } },
            orderBy: { data_inicio: 'asc' },
          },
          setor_rel: { select: { id: true, nome: true } },
          localidade_rel: { select: { id: true, nome: true } },
          emprestado_colaborador: { select: { nome: true } },
          emprestado_setor:       { select: { nome: true } },
        },
      }),
      prisma.notebooks.count({ where }),
    ])

    const mapped = data.map((n: any) => ({
      ...n,
      setor_nome: n.setor_rel?.nome ?? null,
      localidade_nome: n.localidade_rel?.nome ?? null,
      emprestado_colaborador_nome: n.emprestado_colaborador?.nome ?? null,
      emprestado_setor_nome:       n.emprestado_setor?.nome ?? null,
      // limpar relações aninhadas
      emprestado_colaborador: undefined,
      emprestado_setor: undefined,
      alocacoes_ativas: n.alocacoes.map((a: any) => ({
        id: a.id,
        colaborador: a.colaborador,
        motivo_alocacao: a.motivo_alocacao,
        tipo_posse: a.tipo_posse,
        setor: a.colaborador.setor_rel?.nome ?? null,
        data_inicio: a.data_inicio,
      })),
      alocacao_ativa: n.alocacoes[0]
        ? {
            colaborador: n.alocacoes[0].colaborador,
            motivo_alocacao: n.alocacoes[0].motivo_alocacao,
            tipo_posse: n.alocacoes[0].tipo_posse,
            setor: n.alocacoes[0].colaborador?.setor_rel?.nome ?? null,
            data_inicio: n.alocacoes[0].data_inicio,
          }
        : null,
      alocacoes: undefined,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/notebooks]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession()
    const body = await request.json()
    
    if (body.data_revisao) {
      body.data_revisao = new Date(body.data_revisao + 'T00:00:00.000Z')
    } else if (body.data_revisao === '' || body.data_revisao === null) {
      body.data_revisao = null
    }

    if (body?.numero_patrimonio) {
      const existe = await prisma.notebooks.findFirst({
        where: {
          numero_patrimonio: body.numero_patrimonio,
        },
      })

      if (existe) {
        return NextResponse.json(
          {
            error: `Número de patrimônio ${body.numero_patrimonio} já cadastrado`,
          },
          { status: 409 }
        )
      }
    }

const data = await withLocalidadePadrao(
  withoutLegacyVirtualFields(body)
)

const item = await prisma.notebooks.create({ data })

    await registrarAuditoria({
      tabela: 'notebooks',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Notebook "${item.modelo ?? item.numero_patrimonio ?? item.id}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/notebooks]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
