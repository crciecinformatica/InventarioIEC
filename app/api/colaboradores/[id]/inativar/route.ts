import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function POST(_: Request, { params }: Props) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession()

  const colaborador = await prisma.colaboradores.findUnique({ where: { id } })
  if (!colaborador) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Buscar todas as alocações ativas antes de desativar
  const [maquinas, notebooks, aparelhos, ramais] = await Promise.all([
    prisma.alocacoes_maquinas.findMany({
      where: { colaborador_id: id, ativo: true },
      include: { maquina: { select: { id: true, endereco_ip: true, nome_host: true } } },
    }),
    prisma.alocacoes_notebooks.findMany({
      where: { colaborador_id: id, ativo: true },
      include: { notebook: { select: { id: true, numero_patrimonio: true } } },
    }),
    prisma.alocacoes_aparelhos.findMany({
      where: { colaborador_id: id, ativo: true },
      include: { aparelho: { select: { id: true, modelo: true } } },
    }),
    prisma.alocacoes_ramais.findMany({
      where: { colaborador_id: id, ativo: true },
      include: { ramal: { select: { id: true, numero_ramal: true } } },
    }),
  ])

  const agora = new Date()

  // Desativar todas as alocações em paralelo
  await Promise.all([
    prisma.alocacoes_maquinas.updateMany({
      where: { colaborador_id: id, ativo: true },
      data: { ativo: false, data_fim: agora },
    }),
    prisma.alocacoes_notebooks.updateMany({
      where: { colaborador_id: id, ativo: true },
      data: { ativo: false, data_fim: agora },
    }),
    prisma.alocacoes_aparelhos.updateMany({
      where: { colaborador_id: id, ativo: true },
      data: { ativo: false, data_fim: agora },
    }),
    prisma.alocacoes_ramais.updateMany({
      where: { colaborador_id: id, ativo: true },
      data: { ativo: false, data_fim: agora },
    }),
  ])

  // Inativar o colaborador
  await prisma.colaboradores.update({
    where: { id },
    data: { status: 'Inativo' },
  })

  // Montar labels descritivos para o log
  const labelsDesalocados: string[] = [
    ...maquinas.map(a => `Máquina ${a.maquina?.endereco_ip ?? a.maquina?.nome_host ?? a.id}`),
    ...notebooks.map(a => `Notebook ${a.notebook?.numero_patrimonio ?? a.id}`),
    ...aparelhos.map(a => `Aparelho ${a.aparelho?.modelo ?? a.id}`),
    ...ramais.map(a => `Ramal ${a.ramal?.numero_ramal ?? a.id}`),
  ]

  const totalAlocacoes = labelsDesalocados.length

  // Registro 1: inativação do colaborador
  await registrarAuditoria({
    tabela: 'colaboradores',
    registro_id: id,
    acao: 'UPDATE',
    descricao: `Colaborador "${colaborador.nome}": Ativo → Inativo`,
    dados_anteriores: { status: 'Ativo' },
    dados_novos: { status: 'Inativo' },
    usuario_id,
    usuario_nome,
  })

  // Registro 2: desalocações em massa (apenas se havia alocações)
  if (totalAlocacoes > 0) {
    await registrarAuditoria({
      tabela: 'colaboradores',
      registro_id: id,
      acao: 'DESALOCAR',
      descricao: `${totalAlocacoes} alocação${totalAlocacoes > 1 ? 'ões' : ''} desalocada${totalAlocacoes > 1 ? 's' : ''}: ${labelsDesalocados.join(', ')}`,
      dados_anteriores: {
        maquinas: maquinas.map(a => ({ id: a.id, ip: a.maquina?.endereco_ip })),
        notebooks: notebooks.map(a => ({ id: a.id, patrimonio: a.notebook?.numero_patrimonio })),
        aparelhos: aparelhos.map(a => ({ id: a.id, modelo: a.aparelho?.modelo })),
        ramais: ramais.map(a => ({ id: a.id, numero: a.ramal?.numero_ramal })),
      },
      dados_novos: null,
      usuario_id,
      usuario_nome,
    })
  }

  return NextResponse.json({
    ok: true,
    totalDesalocados: totalAlocacoes,
    desalocados: labelsDesalocados,
  })
}