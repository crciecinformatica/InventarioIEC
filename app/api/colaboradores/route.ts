import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'
import { withLocalidadePadrao } from '@/lib/localidades'
import { withoutLegacyVirtualFields } from '@/lib/payload'
import { status_colaborador, type Prisma } from '@prisma/client'

export const runtime = 'nodejs'

function parseSetorIds(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    const page = Math.max(
      1,
      parseInt(searchParams.get('page') || '1', 10)
    )

    const limit = Math.max(
      1,
      Math.min(
        10000,
        parseInt(searchParams.get('limit') || '20', 10)
      )
    )

    const search = (
      searchParams.get('search') || ''
    ).trim()

    const setorId =
      searchParams.get('setor_id') || ''

    const setorIds = parseSetorIds(setorId)

    const localidadeId =
      searchParams.get('localidade_id') || ''

    const localidadeIds =
      parseSetorIds(localidadeId)

    const status =
      searchParams.get('status') || ''

    const sort =
      searchParams.get('sort') || 'nome'

    const dir =
      searchParams.get('dir') === 'desc'
        ? 'desc'
        : 'asc'

    const validSortFields: Record<
      string,
      boolean
    > = {
      nome: true,
      codigo: true,
      created_at: true,
    }

    const safeSort = validSortFields[sort]
      ? sort
      : 'nome'

    const AND: Prisma.colaboradoresWhereInput[] =
      []

    if (search) {
      const codigo = parseInt(search, 10)

      AND.push({
        OR: [
          {
            nome: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            setor_rel: {
              nome: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            localidade_rel: {
              nome: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          ...(!isNaN(codigo)
            ? [{ codigo }]
            : []),
        ],
      })
    }

    if (setorIds.length === 1) {
      AND.push({ setor_id: setorIds[0] })
    }

    if (setorIds.length > 1) {
      AND.push({
        setor_id: { in: setorIds },
      })
    }

    if (localidadeIds.length === 1) {
      AND.push({
        localidade_id: localidadeIds[0],
      })
    }

    if (localidadeIds.length > 1) {
      AND.push({
        localidade_id: {
          in: localidadeIds,
        },
      })
    }

    if (
      status === status_colaborador.Ativo ||
      status === status_colaborador.Inativo
    ) {
      AND.push({ status })
    }

    const where: Prisma.colaboradoresWhereInput =
      AND.length > 0 ? { AND } : {}

    const orderBy: Prisma.colaboradoresOrderByWithRelationInput =
      {
        [safeSort]: dir,
      }

    const [data, total] = await Promise.all([
      prisma.colaboradores.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          setor_rel: {
            select: {
              id: true,
              nome: true,
            },
          },
          localidade_rel: {
            select: {
              id: true,
              nome: true,
            },
          },
          _count: {
            select: {
              alocacoes_maquinas: {
                where: { ativo: true },
              },
              alocacoes_notebooks: {
                where: { ativo: true },
              },
              notebooks_emprestados: {
                where: { emprestado: true },
              },
              alocacoes_aparelhos: {
                where: { ativo: true },
              },
              alocacoes_ramais: {
                where: { ativo: true },
              },
            },
          },
        },
      }),

      prisma.colaboradores.count({
        where,
      }),
    ])

    const mapped = data.map(c => ({
      ...c,
      setor_nome:
        c.setor_rel?.nome ?? null,
      localidade_nome:
        c.localidade_rel?.nome ?? null,
      alocacoes_maquinas_ativas:
        c._count?.alocacoes_maquinas ?? 0,
      alocacoes_notebooks_ativas:
        (c._count?.alocacoes_notebooks ??
          0) +
        (c._count?.notebooks_emprestados ??
          0),
      alocacoes_aparelhos_ativas:
        c._count?.alocacoes_aparelhos ??
        0,
      alocacoes_ramais_ativas:
        c._count?.alocacoes_ramais ?? 0,
      _count: undefined,
    }))

    return NextResponse.json({
      data: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(
      '[GET /api/colaboradores]',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        error: 'Erro interno',
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const session = await getServerSession(
      authOptions
    )

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { usuario_id, usuario_nome } =
      await getAuditSession()

    const body =
      (await request.json()) as Prisma.colaboradoresCreateInput

    const { codigo } = body

    if (codigo) {
      const existe =
        await prisma.colaboradores.findFirst({
          where: {
            codigo: Number(codigo),
          },
        })

      if (existe) {
        return NextResponse.json(
          {
            error: `Código ${codigo} já cadastrado para "${existe.nome}"`,
          },
          { status: 409 }
        )
      }
    }

    const data =
      await withLocalidadePadrao(
        withoutLegacyVirtualFields(
          body as any
        )
      )

    const item =
      await prisma.colaboradores.create({
        data,
      })

    await registrarAuditoria({
      tabela: 'colaboradores',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Colaborador "${item.nome}" criado`,
      dados_novos: item,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, {
      status: 201,
    })
  } catch (error) {
    console.error(
      '[POST /api/colaboradores]',
      error
    )

    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}