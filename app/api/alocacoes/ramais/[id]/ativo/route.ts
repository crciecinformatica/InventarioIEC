import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: Props) {
  const denied = await requireAdmin()
  if (denied) return denied

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: ramal_id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession()

  const alocacaoAtiva = await prisma.alocacoes_ramais.findFirst({
    where: { ramal_id, ativo: true },
    include: { colaborador: { select: { nome: true } } },
  })

  await prisma.alocacoes_ramais.updateMany({
    where: { ramal_id, ativo: true },
    data: { ativo: false, data_fim: new Date() },
  })

  await registrarAuditoria({
    tabela: 'alocacoes_ramais',
    registro_id: ramal_id,
    acao: 'DESALOCAR',
    descricao: `Desalocado de ${alocacaoAtiva?.colaborador?.nome ?? 'colaborador desconhecido'}`,
    dados_anteriores: alocacaoAtiva ? { colaborador_nome: alocacaoAtiva.colaborador?.nome, whatsapp: alocacaoAtiva.whatsapp } : null,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json({ ok: true })
}