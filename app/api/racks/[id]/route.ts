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
  const item = await prisma.racks.findUnique({
    where: { id },
    include: {
      setor_rel: { select: { id: true, nome: true } },
      localidade_rel: { select: { id: true, nome: true } },
    },
  })

  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({
  ...item,
  setor_nome: item.setor_rel?.nome ?? item.localizacao ?? null,
  localidade_nome: item.localidade_rel?.nome ?? null,
  portas_livres:
    item.quantidade_portas != null && item.portas_em_uso != null
      ? Math.max(0, item.quantidade_portas - item.portas_em_uso)
      : null,
  })
}

export async function PUT(request: Request, { params }: Props) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const { id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()
    const body = await request.json()

    const {
      portas_livres,
      setor_rel,
      setor_nome,
      localidade_rel,
      localidade_nome,
      created_at,
      id: _id,
      ...rest
    } = body

    const anterior = await prisma.racks.findUnique({ where: { id } })
    if (!anterior) return NextResponse.json({ error: 'Rack não encontrado' }, { status: 404 })

    const item = await prisma.racks.update({ where: { id }, data: rest })

    const [anteriorEnriquecido, novoEnriquecido] = await Promise.all([
      enrichAuditSnapshot(anterior as any),
      enrichAuditSnapshot(rest as any),
    ])

    await registrarAuditoria({
      tabela: 'racks', registro_id: id, acao: 'UPDATE',
      descricao: descricaoDiff(anteriorEnriquecido as any, novoEnriquecido as any),
      dados_anteriores: anteriorEnriquecido as any, dados_novos: novoEnriquecido as any,
      usuario_id, usuario_nome,
    })

    return NextResponse.json({
      ...item,
      setor_nome: null,
      localidade_nome: null,
      portas_livres:
        item.quantidade_portas != null && item.portas_em_uso != null
          ? Math.max(0, item.quantidade_portas - item.portas_em_uso)
          : null,
    })
    
  } catch (error) {
    console.error('[PUT /api/racks/[id]]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const { id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()

    const anterior = await prisma.racks.findUnique({ where: { id } })
    await prisma.racks.delete({ where: { id } })

    const anteriorEnriquecido = await enrichAuditSnapshot(anterior as any)

    await registrarAuditoria({
      tabela: 'racks', registro_id: id, acao: 'DELETE',
      descricao: `Rack "${anterior?.nome_switch ?? id}" excluído`,
      dados_anteriores: anteriorEnriquecido as any,
      usuario_id, usuario_nome,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/racks/[id]]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
