import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id: maquina_id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()

    const alocacaoAtiva = await prisma.alocacoes_maquinas.findFirst({
      where: { maquina_id, ativo: true },
      include: { colaborador: { select: { nome: true, setor_rel: { select: { nome: true } } } } },
    })

    await prisma.alocacoes_maquinas.updateMany({
      where: { maquina_id, ativo: true },
      data: { ativo: false, data_fim: new Date() },
    })

    await registrarAuditoria({
      tabela: 'alocacoes_maquinas',
      registro_id: maquina_id,
      acao: 'DESALOCAR',
      descricao: `Desalocada de ${alocacaoAtiva?.colaborador?.nome ?? 'colaborador desconhecido'}`,
      dados_anteriores: alocacaoAtiva
        ? {
            alocacao_id: alocacaoAtiva.id,
            colaborador_id: alocacaoAtiva.colaborador_id,
            colaborador_nome: alocacaoAtiva.colaborador?.nome ?? null,
            colaborador_setor: alocacaoAtiva.colaborador?.setor_rel?.nome ?? null,
            data_inicio: alocacaoAtiva.data_inicio,
          }
        : null,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/alocacoes/maquinas/[id]/ativo]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
