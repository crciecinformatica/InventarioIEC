import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession, descricaoDiff } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

async function enrichAuditSnapshot(snapshot: Record<string, any> | null) {
  if (!snapshot) return snapshot
  const { setor_id, localidade_id, ...rest } = snapshot
  let setor_nome: string | null = null
  let localidade_nome: string | null = null
  if (setor_id) {
    const setor = await prisma.setores.findUnique({ where: { id: setor_id }, select: { nome: true } })
    setor_nome = setor?.nome ?? setor_id
  }
  if (localidade_id) {
    const localidade = await prisma.localidades.findUnique({
      where: { id: localidade_id },
      select: { nome: true },
    })
    localidade_nome = localidade?.nome ?? localidade_id
  }
  return {
    ...rest,
    ...(setor_id !== undefined ? { setor_nome } : {}),
    ...(localidade_id !== undefined ? { localidade_nome } : {}),
  }
}

export async function GET(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const item = await prisma.ramais.findUnique({
    where: { id },
    include: {
      alocacoes: {
        where: { ativo: true },
        include: { colaborador: { select: { nome: true, setor_rel: { select: { nome: true } } } } },
        orderBy: { data_inicio: 'asc' },
      },
      setor_rel: { select: { id: true, nome: true } },
      localidade_rel: { select: { id: true, nome: true } },
    },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({
  ...item,

  alocacoes_ativas: item.alocacoes.map((a: any) => ({
    id: a.id,
    colaborador: a.colaborador,
    tipo_base: a.tipo_base,
    whatsapp: a.whatsapp,
    setor: a.colaborador?.setor_rel?.nome ?? null,
    canal_adicional: a.canal_adicional,
    data_inicio: a.data_inicio,
  })),

  alocacao_ativa: item.alocacoes[0]
    ? {
        colaborador: item.alocacoes[0].colaborador,
        tipo_base: item.alocacoes[0].tipo_base,
        whatsapp: item.alocacoes[0].whatsapp,
        canal_adicional: item.alocacoes[0].canal_adicional,
        data_inicio: item.alocacoes[0].data_inicio,
        setor: item.alocacoes[0].colaborador?.setor_rel?.nome ?? null,
      }
    : null,

  alocacoes: undefined,

  setor_nome: item.setor_rel?.nome ?? null,
  localidade_nome: item.localidade_rel?.nome ?? null,
})
}

export async function PUT(request: Request, { params }: Props) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession()
  const body = await request.json()
  const { created_at, id: _id, alocacoes, alocacao_ativa, setor, nome_setor, setor_nome, setor_rel, localidade_nome, localidade_rel, ...data } = body

  const anterior = await prisma.ramais.findUnique({ where: { id } })
  const item = await prisma.ramais.update({ where: { id }, data })

  const [anteriorEnriquecido, novoEnriquecido] = await Promise.all([
    enrichAuditSnapshot(anterior as any),
    enrichAuditSnapshot(data as any),
  ])

  await registrarAuditoria({
    tabela: 'ramais', registro_id: id, acao: 'UPDATE',
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

  const anterior = await prisma.ramais.findUnique({ where: { id } })
  await prisma.ramais.delete({ where: { id } })

  const anteriorEnriquecido = await enrichAuditSnapshot(anterior as any)

  await registrarAuditoria({
    tabela: 'ramais', registro_id: id, acao: 'DELETE',
    descricao: `Ramal "${anterior?.numero_ramal ?? id}" excluído`,
    dados_anteriores: anteriorEnriquecido as any,
    usuario_id, usuario_nome,
  })

  return NextResponse.json({ ok: true })
}
