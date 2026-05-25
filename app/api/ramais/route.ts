import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'
import { withLocalidadePadrao } from '@/lib/localidades'
import { withoutLegacyVirtualFields } from '@/lib/payload'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

function parseSetorIds(value: string) {
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page            = Math.max(1, parseInt(searchParams.get('page')  || '1', 10))
    const limit           = Math.max(1, Math.min(10000, parseInt(searchParams.get('limit') || '20', 10)))
    const search          = (searchParams.get('search') || '').trim()
    const disponibilidade = (searchParams.get('disponibilidade') || '').trim()
    const fila            = searchParams.get('fila')       || ''
    const alocacao        = searchParams.get('alocacao')   || ''
    const whatsapp        = searchParams.get('whatsapp')   || ''
    const setorId         = searchParams.get('setor_id')   || ''   // ← ADICIONADO
    const setorIds        = parseSetorIds(setorId)
    const localidadeId    = searchParams.get('localidade_id') || ''
    const localidadeIds   = parseSetorIds(localidadeId)
    const sort            = searchParams.get('sort')       || 'numero_ramal'
    const dir: Prisma.SortOrder = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    const validSortFields: Record<string, boolean> = {
      numero_ramal: true, setor_id: true,
      prefixo_telefonico: true, disponibilidade: true, created_at: true,
    }
    const safeSort = validSortFields[sort] ? sort : 'numero_ramal'

    const AND: any[] = []

    // Filtro de texto — NÃO inclui setor_id (UUID não aceita contains)
    if (search) {
      AND.push({
        OR: [
          { numero_ramal: { contains: search, mode: 'insensitive' } },
          {
            alocacoes: {
              some: {
                ativo: true,
                colaborador: { nome: { contains: search, mode: 'insensitive' } },
              },
            },
          },
          // Busca por nome do setor via relação
          {
            setor_rel: {
              nome: { contains: search, mode: 'insensitive' },
            },
          },
          {
            localidade_rel: {
              nome: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      })
    }

    // Filtro por setor selecionado no SetorSelect — comparação exata por UUID
    if (setorIds.length === 1) AND.push({ setor_id: setorIds[0] })
    if (setorIds.length > 1) AND.push({ setor_id: { in: setorIds } })
    if (localidadeIds.length === 1) AND.push({ localidade_id: localidadeIds[0] })
    if (localidadeIds.length > 1) AND.push({ localidade_id: { in: localidadeIds } })

    if (disponibilidade) {
      AND.push({ disponibilidade: { contains: disponibilidade, mode: 'insensitive' } })
    }

    if (fila !== '') {
      AND.push({ fila: fila === 'true' })
    }

    if (alocacao === 'alocado') {
      AND.push({ alocacoes: { some: { ativo: true, ramal_id: { not: null } } } })
    } else if (alocacao === 'livre') {
      AND.push({ alocacoes: { none: { ativo: true, ramal_id: { not: null } } } })
    }

    if (whatsapp === 'true') {
      AND.push({
        alocacoes: {
          some: { ativo: true, whatsapp: true, ramal_id: { not: null } },
        },
      })
    }

    const where: any = AND.length > 0 ? { AND } : {}

    // Ordenação — setor via relação precisa de sintaxe diferente
    const orderBy = safeSort === 'setor_id'
      ? { setor_rel: { nome: dir } }
      : { [safeSort]: dir }

    const [data, total] = await Promise.all([
      prisma.ramais.findMany({
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
      prisma.ramais.count({ where }),
    ])

    const ids = data.map((r: any) => r.id)
    const ultimasEdicoes = ids.length > 0
      ? await prisma.audit_log.findMany({
          where: { registro_id: { in: ids }, tabela: 'ramais', acao: 'UPDATE' },
          orderBy: { created_at: 'desc' },
          select: { registro_id: true, created_at: true },
        })
      : []

    const ultimaEdicaoMap: Record<string, string> = {}
    for (const log of ultimasEdicoes) {
      if (log.registro_id && !ultimaEdicaoMap[log.registro_id]) {
        ultimaEdicaoMap[log.registro_id] = log.created_at?.toISOString() ?? ''
      }
    }

    const mapped = data.map((r: any) => ({
      ...r,
      setor_nome: r.setor_rel?.nome ?? null,
      localidade_nome: r.localidade_rel?.nome ?? null,
      alocacoes_ativas: r.alocacoes.map((a: any) => ({
        id: a.id,
        colaborador: a.colaborador,
        tipo_base: a.tipo_base,
        whatsapp: a.whatsapp,
        setor: a.colaborador.setor_rel?.nome ?? null,
        canal_adicional: a.canal_adicional,
        data_inicio: a.data_inicio,
      })),
      alocacao_ativa: r.alocacoes[0]
        ? {
            colaborador: r.alocacoes[0].colaborador,
            tipo_base: r.alocacoes[0].tipo_base,
            whatsapp: r.alocacoes[0].whatsapp,
            setor:
              r.alocacoes[0].colaborador?.setor_rel?.nome ?? null,
            data_inicio: r.alocacoes[0].data_inicio,
          }
        : null,
      ultima_revisao: ultimaEdicaoMap[r.id] ?? null,
      alocacoes: undefined,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/ramais]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession()
    const body = await request.json()

    if (body?.numero_ramal) {
      const existe = await prisma.ramais.findFirst({
        where: {
          numero_ramal: body.numero_ramal,
        },
      })

      if (existe) {
        return NextResponse.json(
          { error: `Número do ramal ${body.numero_ramal} já cadastrado` },
          { status: 409 }
        )
      }
    }

    const data = await withLocalidadePadrao(
      withoutLegacyVirtualFields(body)
    )

const item = await prisma.ramais.create({ data })

    await registrarAuditoria({
      tabela: 'ramais',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Ramal "${item.numero_ramal ?? item.id}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/ramais] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
