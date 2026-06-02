import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { notebook_id, colaborador_id, motivo_alocacao, tipo_posse } = await request.json()
  if (!notebook_id || !colaborador_id) {
    return NextResponse.json({ error: 'notebook_id e colaborador_id são obrigatórios' }, { status: 400 })
  }

  const { usuario_id, usuario_nome } = await getAuditSession()

  const colaborador = await prisma.colaboradores.findUnique({
    where: { id: colaborador_id },
    select: { nome: true, setor_rel: { select: { nome: true } } },
  })
  const colaboradorSetor = colaborador?.setor_rel?.nome ?? null

  const alocacao = await prisma.alocacoes_notebooks.create({
    data: { notebook_id, colaborador_id, motivo_alocacao: motivo_alocacao || null, tipo_posse: tipo_posse || null, data_inicio: new Date(), ativo: true },
  })

  await registrarAuditoria({
    tabela: 'alocacoes_notebooks',
    registro_id: notebook_id,
    acao: 'ALOCAR',
    descricao: `Alocado para ${colaborador?.nome ?? colaborador_id}${colaboradorSetor ? ` (${colaboradorSetor})` : ''}`,
    dados_novos: { colaborador_id, colaborador_nome: colaborador?.nome, motivo_alocacao, tipo_posse },
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json(alocacao, { status: 201 })
}
