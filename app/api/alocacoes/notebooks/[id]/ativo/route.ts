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

    const { id: notebook_id } = await params
    console.log('[DESALOCAR NOTEBOOK] notebook_id:', notebook_id)

    const { usuario_id, usuario_nome } = await getAuditSession()
    console.log('[DESALOCAR NOTEBOOK] usuário:', { usuario_id, usuario_nome })

    // Buscar alocação ativa ANTES de desativar
    const alocacaoAtiva = await prisma.alocacoes_notebooks.findFirst({
      where: { notebook_id, ativo: true },
      include: { colaborador: { select: { nome: true, setor_rel: { select: { nome: true } } } } },
    })
    console.log('[DESALOCAR NOTEBOOK] alocação ativa encontrada:', alocacaoAtiva?.id ?? 'NENHUMA')

    await prisma.alocacoes_notebooks.updateMany({
      where: { notebook_id, ativo: true },
      data: { ativo: false, data_fim: new Date() },
    })
    console.log('[DESALOCAR NOTEBOOK] alocação desativada')

    await registrarAuditoria({
      tabela: 'alocacoes_notebooks',
      registro_id: notebook_id,
      acao: 'DESALOCAR',
      descricao: `Desalocado de ${alocacaoAtiva?.colaborador?.nome ?? 'colaborador desconhecido'}`,
      dados_anteriores: alocacaoAtiva
        ? {
            alocacao_id: alocacaoAtiva.id,
            colaborador_id: alocacaoAtiva.colaborador_id,
            colaborador_nome: alocacaoAtiva.colaborador?.nome ?? null,
            colaborador_setor: alocacaoAtiva.colaborador?.setor_rel?.nome ?? null,
            data_inicio: alocacaoAtiva.data_inicio,
            motivo_alocacao: alocacaoAtiva.motivo_alocacao,
          }
        : null,
      usuario_id,
      usuario_nome,
    })
    console.log('[DESALOCAR NOTEBOOK] auditoria registrada com sucesso')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DESALOCAR NOTEBOOK] ERRO:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
