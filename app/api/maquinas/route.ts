import type { Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
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
    const page      = Math.max(1, parseInt(searchParams.get('page')  || '1', 10))
    const limit     = Math.max(1, Math.min(10000, parseInt(searchParams.get('limit') || '20', 10)))
    const search    = (searchParams.get('search')    || '').trim()
    const setorId   = searchParams.get('setor_id')   || ''
    const setorIds  = parseSetorIds(setorId)
    const localidadeId = searchParams.get('localidade_id') || ''
    const localidadeIds = parseSetorIds(localidadeId)
    const categoria = searchParams.get('categoria')  || ''
    const enderecoIp = searchParams.get('endereco_ip')  || ''
    const fabricante= searchParams.get('fabricante') || ''
    const alocacao  = searchParams.get('alocacao')   || ''
    const sort      = searchParams.get('sort')       || 'endereco_ip'
    const dir: Prisma.SortOrder = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    const validSortFields: Record<string, boolean> = {
      nome_host: true, identificador: true, fabricante: true,
      modelo: true, created_at: true, endereco_ip: true, enderecoIp: true, setor_id: true,
    }
    const safeSort = validSortFields[sort] ? sort : 'endereco_ip'

    const AND: any[] = []

    if (search) {
      AND.push({
        OR: [
          { nome_host:    { contains: search, mode: 'insensitive' } },
          { identificador:{ contains: search, mode: 'insensitive' } },
          { fabricante:   { contains: search, mode: 'insensitive' } },
          { endereco_ip:   { contains: search, mode: 'insensitive' } },
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
    if (categoria) AND.push({ categoria })
    if (fabricante) AND.push({ fabricante: { contains: fabricante, mode: 'insensitive' } })
    if (enderecoIp) AND.push({ endereco_ip: { contains: enderecoIp, mode: 'insensitive' } })

    if (alocacao === 'alocado') {
      AND.push({ alocacoes: { some: { ativo: true, maquina_id: { not: null } } } })
    } else if (alocacao === 'livre') {
      AND.push({ alocacoes: { none: { ativo: true, maquina_id: { not: null } } } })
    }

    const where: any = AND.length > 0 ? { AND } : {}

    const orderBy = safeSort === 'setor_id'
      ? { setor_rel: { nome: dir } }
      : { [safeSort === 'enderecoIp' ? 'endereco_ip' : safeSort]: dir }

    const [data, total] = await Promise.all([
      prisma.maquinas.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          alocacoes: {
            where: { ativo: true },
            include: { colaborador: { select: { id: true, nome: true, setor_rel: { select: { nome: true } } } } },
            orderBy: { data_inicio: 'asc' },
          },
          setor_rel: { select: { id: true, nome: true } },
          localidade_rel: { select: { id: true, nome: true } },
        },
      }),
      prisma.maquinas.count({ where }),
    ])

    const mapped = data.map((m: any) => ({
      ...m,
      setor_nome: m.setor_rel?.nome ?? null,
      localidade_nome: m.localidade_rel?.nome ?? null,
      alocacoes_ativas: m.alocacoes.map((a: any) => ({
        id: a.id,
        colaborador: a.colaborador,
        tipo_uso: a.tipo_uso,
        data_inicio: a.data_inicio,
        setor: a.colaborador.setor_rel?.nome ?? a.colaborador?.setor ?? null,
      })),
      alocacao_ativa: m.alocacoes[0]
        ? {
            colaborador: m.alocacoes[0].colaborador ?? null,
            tipo_uso: m.alocacoes[0].tipo_uso,
            data_inicio: m.alocacoes[0].data_inicio,
            setor:
              m.alocacoes[0].colaborador.setor_rel?.nome ??
              m.alocacoes[0].colaborador?.setor ??
              null,
          }
        : null,
      alocacoes: undefined,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/maquinas]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession()
const body = await request.json()

if (body?.endereco_ip) {
  const existeIp = await prisma.maquinas.findFirst({
    where: {
      endereco_ip: body.endereco_ip,
    },
  })

  if (existeIp) {
    return NextResponse.json(
      { error: `Endereço IP ${body.endereco_ip} já cadastrado` },
      { status: 409 }
    )
  }
}

if (body?.nome_host) {
  const existeHostname = await prisma.maquinas.findFirst({
    where: {
      nome_host: body.nome_host,
    },
  })

  if (existeHostname) {
    return NextResponse.json(
      { error: `Hostname ${body.nome_host} já cadastrado` },
      { status: 409 }
    )
  }
}

const data = await withLocalidadePadrao(
  withoutLegacyVirtualFields(body)
)

const id = randomUUID()

const item = await prisma.maquinas.create({
  data: {
    ...data,
    id,
    identificador: id,
  },
})

    await registrarAuditoria({
      tabela: 'maquinas',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Máquina "${item.nome_host ?? item.identificador ?? item.id}" criada`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/maquinas]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
