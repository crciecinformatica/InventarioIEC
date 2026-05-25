import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession, descricaoDiff } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

async function enrichAuditSnapshot(snapshot: Record<string, any> | null) {
  if (!snapshot) return snapshot

  const { setor_id, localidade_id, emprestado_setor_id, ...rest } = snapshot

  const [setorRes, localidadeRes, empSetorRes] = await Promise.all([
    setor_id
      ? prisma.setores.findUnique({
          where: { id: setor_id },
          select: { nome: true },
        })
      : null,

    localidade_id
      ? prisma.localidades.findUnique({
          where: { id: localidade_id },
          select: { nome: true },
        })
      : null,

    emprestado_setor_id
      ? prisma.setores.findUnique({
          where: { id: emprestado_setor_id },
          select: { nome: true },
        })
      : null,
  ])

  return {
    ...rest,

    ...(setor_id !== undefined
      ? { setor_nome: setorRes?.nome ?? setor_id }
      : {}),

    ...(localidade_id !== undefined
      ? { localidade_nome: localidadeRes?.nome ?? localidade_id }
      : {}),

    ...(emprestado_setor_id !== undefined
      ? {
          emprestado_setor_nome:
            empSetorRes?.nome ?? emprestado_setor_id,
        }
      : {}),
  }
}

export async function GET(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const item = await prisma.notebooks.findUnique({
    where: { id },
    include: {
      alocacoes: {
        where: { ativo: true },
        include: {
          colaborador: {
            select: {
              id: true,
              nome: true,
              setor_rel: {
                select: { nome: true },
              },
            },
          },
        },
        orderBy: { data_inicio: 'asc' },
      },
      setor_rel: { select: { id: true, nome: true } },
      localidade_rel: { select: { id: true, nome: true } },
      emprestado_colaborador: { select: { nome: true } },
      emprestado_setor: { select: { nome: true } },
    },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({
    ...item,
    alocacoes_ativas: item.alocacoes.map((a: any) => ({
      id: a.id,
      colaborador: a.colaborador,
      motivo_alocacao: a.motivo_alocacao,
      setor: a.colaborador?.setor_rel?.nome ?? null,
      tipo_posse: a.tipo_posse,
      data_inicio: a.data_inicio,
    })),

    alocacao_ativa: item.alocacoes[0]
      ? {
          colaborador: item.alocacoes[0].colaborador,
          motivo_alocacao: item.alocacoes[0].motivo_alocacao,
          tipo_posse: item.alocacoes[0].tipo_posse,
          data_inicio: item.alocacoes[0].data_inicio,
          setor:
            item.alocacoes[0].colaborador?.setor_rel?.nome ?? null,
        }
      : null,
    alocacoes: undefined,
    setor_nome: item.setor_rel?.nome ?? null,
    localidade_nome: item.localidade_rel?.nome ?? null,
    emprestado_colaborador_nome: (item as any).emprestado_colaborador?.nome ?? null,
    emprestado_setor_nome: (item as any).emprestado_setor?.nome ?? null,
    emprestado_colaborador: undefined,
    emprestado_setor: undefined,
  })
}

export async function PUT(request: Request, { params }: Props) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID do notebook não fornecido' }, { status: 400 })
    const { usuario_id, usuario_nome } = await getAuditSession()
    const body = await request.json()

    const {
      alocacoes,
      alocacao_ativa,
      created_at,
      id: _id,
      setor,
      nome_setor,
      setor_nome,
      setor_rel,
      localidade_nome,
      localidade_rel,
      emprestado_colaborador_nome,
      emprestado_setor_nome,
      ...rest
    } = body

  const anterior = await prisma.notebooks.findUnique({ where: { id } })
  if (!anterior) return NextResponse.json({ error: `Notebook não encontrado (ID: ${id})` }, { status: 404 })

  const data: any = { ...rest }
  if (data.emprestado_desde) {
    data.emprestado_desde = new Date(data.emprestado_desde + 'T00:00:00.000Z')
  } else if (data.emprestado_desde === '' || data.emprestado_desde === null) {
    data.emprestado_desde = null
  }

  if (data.emprestado_colaborador_id) {
    const colaborador = await prisma.colaboradores.findUnique({ where: { id: data.emprestado_colaborador_id } })
    if (!colaborador) return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
  }
  if (data.emprestado_setor_id) {
    const setor = await prisma.setores.findUnique({ where: { id: data.emprestado_setor_id } })
    if (!setor) return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 })
  }

  const item = await prisma.notebooks.update({ where: { id }, data })

  const [anteriorEnriquecido, novoEnriquecido] = await Promise.all([
    enrichAuditSnapshot(anterior as any),
    enrichAuditSnapshot(data as any),
  ])

  await registrarAuditoria({
    tabela: 'notebooks', registro_id: id, acao: 'UPDATE',
    descricao: descricaoDiff(anteriorEnriquecido as any, novoEnriquecido as any),
    dados_anteriores: anteriorEnriquecido as any, dados_novos: novoEnriquecido as any,
    usuario_id, usuario_nome,
  })

  return NextResponse.json(item)
}

export async function DELETE(request: Request, { params }: Props) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession()

  const anterior = await prisma.notebooks.findUnique({ where: { id } })
  await prisma.notebooks.delete({ where: { id } })

  const anteriorEnriquecido = await enrichAuditSnapshot(anterior as any)

  await registrarAuditoria({
    tabela: 'notebooks', registro_id: id, acao: 'DELETE',
    descricao: `Notebook "${anterior?.modelo ?? id}" excluído`,
    dados_anteriores: anteriorEnriquecido as any,
    usuario_id, usuario_nome,
  })

  return NextResponse.json({ ok: true })
}
