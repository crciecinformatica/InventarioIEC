import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { aparelho_id, colaborador_id, descricao_alocacao, motivo_alocacao } = await request.json()
  if (!aparelho_id || !colaborador_id) {
    return NextResponse.json({ error: 'aparelho_id e colaborador_id são obrigatórios' }, { status: 400 })
  }

  const { usuario_id, usuario_nome } = await getAuditSession()

  const colaborador = await prisma.colaboradores.findUnique({
    where: { id: colaborador_id },
    select: { nome: true, setor_rel: { select: { nome: true } } },
  })
  const colaboradorSetor = colaborador?.setor_rel?.nome ?? null
  
  const alocacao = await prisma.alocacoes_aparelhos.create({
    data: { aparelho_id, colaborador_id, descricao_alocacao: descricao_alocacao || null, motivo_alocacao: motivo_alocacao || null, data_inicio: new Date(), ativo: true },
  })

  await registrarAuditoria({
    tabela: 'alocacoes_aparelhos',
    registro_id: aparelho_id,
    acao: 'ALOCAR',
    descricao: `Alocado para ${colaborador?.nome ?? colaborador_id}${colaboradorSetor ? ` (${colaboradorSetor})` : ''}`,
    dados_novos: { colaborador_id, colaborador_nome: colaborador?.nome, descricao_alocacao, motivo_alocacao },
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json(alocacao, { status: 201 })
}
