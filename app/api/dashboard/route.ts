import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const colaboradores = await prisma.colaboradores.count({ where: { status: 'Ativo' } })
  const maquinas = await prisma.maquinas.count()
  const notebooks = await prisma.notebooks.count()
  const aparelhos = await prisma.aparelhos.count()
  const impressoras = await prisma.impressoras.count()
  const ramais = await prisma.ramais.count()
  const racks = await prisma.racks.count()
  const solicitacoesAbertas = await prisma.solicitacoes.count({ where: { status_solicitacao: { notIn: [4, 5] } } })
  const maquinasAlocadas = await prisma.alocacoes_maquinas.count({ where: { ativo: true } })
  const notebooksAlocados = await prisma.alocacoes_notebooks.count({ where: { ativo: true } })
  const aparelhosAlocados = await prisma.alocacoes_aparelhos.count({ where: { ativo: true } })
  const ramaisAlocados = await prisma.alocacoes_ramais.count({ where: { ativo: true } })
  const ultimasSolicitacoes = await prisma.solicitacoes.findMany({ orderBy: { created_at: 'desc' }, take: 5 })
  const ultimasMovimentacoes = await prisma.movimentacoes.findMany({
    orderBy: { created_at: 'desc' }, take: 5,
    include: { colaborador: { select: { nome: true } } },
  })

  return NextResponse.json({
    stats: {
      colaboradores,
      maquinas,
      notebooks,
      aparelhos,
      impressoras,
      ramais,
      racks,
      solicitacoesAbertas,
      maquinasAlocadas,
      notebooksAlocados,
      aparelhosAlocados,
      ramaisAlocados,
    },
    ultimasSolicitacoes,
    ultimasMovimentacoes,
  })
}
