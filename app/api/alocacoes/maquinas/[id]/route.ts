import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

// DELETE /api/alocacoes/maquinas/[alocacao_id] — desativa alocação específica
export async function DELETE(request: Request, { params }: Props) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id: alocacao_id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()

    const alocacao = await prisma.alocacoes_maquinas.findUnique({
      where: { id: alocacao_id },
      include: { colaborador: { select: { nome: true } } },
    })

    if (!alocacao) {
      return NextResponse.json({ error: 'Alocação não encontrada' }, { status: 404 })
    }

    await prisma.alocacoes_maquinas.update({
      where: { id: alocacao_id },
      data: { ativo: false, data_fim: new Date() },
    })

    await registrarAuditoria({
      tabela: 'alocacoes_maquinas',
      registro_id: alocacao.maquina_id ?? alocacao_id,
      acao: 'DESALOCAR',
      descricao: `Desalocada de ${alocacao.colaborador?.nome ?? 'colaborador desconhecido'}`,
      dados_anteriores: {
        alocacao_id,
        colaborador_nome: alocacao.colaborador?.nome ?? null,
        data_inicio: alocacao.data_inicio,
      },
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/alocacoes/maquinas/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}