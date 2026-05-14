import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
type Props = { params: Promise<{ "registro-id": string }> }

// Mapeia tabela principal para tabelas de alocação relacionadas
const TABELAS_RELACIONADAS: Record<string, string[]> = {
  maquinas: ['maquinas', 'alocacoes_maquinas'],
  notebooks: ['notebooks', 'alocacoes_notebooks'],
  aparelhos: ['aparelhos', 'alocacoes_aparelhos'],
  ramais: ['ramais', 'alocacoes_ramais'],
  impressoras: ['impressoras'],
  racks: ['racks'],
  colaboradores: ['colaboradores'],
  solicitacoes: ['solicitacoes'],
}

export async function GET(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { "registro-id": registro_id } = await params
  const { searchParams } = new URL(request.url)
  const tabela = searchParams.get('tabela') || ''

  const tabelasFiltro = tabela
    ? (TABELAS_RELACIONADAS[tabela] ?? [tabela])
    : undefined

  const where: any = {
    registro_id,
    ...(tabelasFiltro ? { tabela: { in: tabelasFiltro } } : {}),
  }

  const logs = await prisma.audit_log.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 100,
  })

  return NextResponse.json(logs)
}