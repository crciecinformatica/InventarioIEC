import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession, descricaoDiff } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id: alocacao_id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()
    const body = await request.json()

    console.log('[PATCH alocacao ramal] alocacao_id:', alocacao_id, 'body:', body)

    // Buscar pelo ID da alocação — não pelo ramal_id
    const alocacaoAtual = await prisma.alocacoes_ramais.findUnique({
      where: { id: alocacao_id },
      include: { colaborador: { select: { nome: true } } },
    })

    console.log('[PATCH alocacao ramal] encontrada:', alocacaoAtual?.id, 'whatsapp atual:', alocacaoAtual?.whatsapp)

    if (!alocacaoAtual) {
      return NextResponse.json({ error: 'Alocação não encontrada' }, { status: 404 })
    }

    const anterior = {
      whatsapp: alocacaoAtual.whatsapp,
      canal_adicional: alocacaoAtual.canal_adicional,
    }

    const novo: any = {}
    if (body.whatsapp !== undefined) novo.whatsapp = body.whatsapp
    if (body.canal_adicional !== undefined) novo.canal_adicional = body.canal_adicional

    console.log('[PATCH alocacao ramal] anterior:', anterior, 'novo:', novo)

    const alocacao = await prisma.alocacoes_ramais.update({
      where: { id: alocacao_id },
      data: novo,
    })

    await registrarAuditoria({
      tabela: 'alocacoes_ramais',
      registro_id: alocacaoAtual.ramal_id ?? alocacao_id,
      acao: 'EDITAR_ALOCACAO',
      descricao: `Alocação de ${alocacaoAtual.colaborador?.nome ?? 'colaborador'} editada: ${descricaoDiff(anterior, novo)}`,
      dados_anteriores: anterior,
      dados_novos: novo,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(alocacao)
  } catch (err) {
    console.error('[PATCH /api/alocacoes/ramais/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/alocacoes/ramais/[alocacao_id] — desalocar pelo ID da alocação
export async function DELETE(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id: alocacao_id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()

    const alocacao = await prisma.alocacoes_ramais.findUnique({
      where: { id: alocacao_id },
      include: { colaborador: { select: { nome: true } } },
    })

    if (!alocacao) {
      return NextResponse.json({ error: 'Alocação não encontrada' }, { status: 404 })
    }

    await prisma.alocacoes_ramais.update({
      where: { id: alocacao_id },
      data: { ativo: false, data_fim: new Date() },
    })

    await registrarAuditoria({
      tabela: 'alocacoes_ramais',
      registro_id: alocacao.ramal_id ?? alocacao_id,
      acao: 'DESALOCAR',
      descricao: `Desalocado de ${alocacao.colaborador?.nome ?? 'colaborador desconhecido'}`,
      dados_anteriores: {
        alocacao_id,
        colaborador_nome: alocacao.colaborador?.nome ?? null,
        whatsapp: alocacao.whatsapp,
        data_inicio: alocacao.data_inicio,
      },
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/alocacoes/ramais/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}