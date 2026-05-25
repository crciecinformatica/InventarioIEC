import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: colaborador_id } = await params

  const [maquinas, notebooks, aparelhos, ramais] = await Promise.all([
    prisma.alocacoes_maquinas.findMany({
      where: { colaborador_id, ativo: true },
      include: {
        maquina: {
          select: {
            id: true,
            nome_host: true,
            identificador: true,
            fabricante: true,
            modelo: true,
            categoria: true,
            setor_id: true,
            setor_rel: {select: {nome: true }},
          },
        },
      },
      orderBy: { data_inicio: 'desc' },
    }),
    prisma.alocacoes_notebooks.findMany({
      where: { colaborador_id, ativo: true },
      include: {
        notebook: {
          select: {
            id: true,
            modelo: true,
            fabricante: true,
            numero_patrimonio: true,
            setor_id: true,
            setor_rel: {select: {nome: true }},
          },
        },
      },
      orderBy: { data_inicio: 'desc' },
    }),
    prisma.alocacoes_aparelhos.findMany({
      where: { colaborador_id, ativo: true },
      include: {
        aparelho: {
          select: {
            id: true,
            modelo: true,
            tipo: true,
            chip: true,
            endereco_ip: true,
            endereco_mac: true,
            setor_id: true,
            setor_rel: {select: {nome: true }},
            localidade_rel: { select: { nome: true } },
          },
        },
      },
      orderBy: { data_inicio: 'desc' },
    }),
    prisma.alocacoes_ramais.findMany({
      where: { colaborador_id, ativo: true },
      include: {
        ramal: {
          select: {
            id: true,
            numero_ramal: true,
            prefixo_telefonico: true,
            disponibilidade: true,
            fila: true,
            contemplacao: true,
            status_contemplacao: true,
            setor_id: true,
            setor_rel: {select: {nome: true }},
            localidade_rel: { select: { nome: true } },
          },
        },
      },
      orderBy: { data_inicio: 'desc' },
    }),
  ])

  return NextResponse.json({
    maquinas: maquinas.map((a) => ({
      alocacao_id: a.id,
      data_inicio: a.data_inicio,
      tipo_uso: a.tipo_uso,
      item: a.maquina,
      setor_nome: a.maquina?.setor_rel?.nome ?? null,
    })),
    notebooks: notebooks.map((a) => ({
      alocacao_id: a.id,
      data_inicio: a.data_inicio,
      motivo_alocacao: a.motivo_alocacao,
      item: a.notebook,
      setor_nome: a.notebook?.setor_rel?.nome ?? null,
    })),
    aparelhos: aparelhos.map((a) => ({
      alocacao_id: a.id,
      data_inicio: a.data_inicio,
      motivo_alocacao: a.motivo_alocacao,
      item: a.aparelho ? {
        ...a.aparelho,
        setor_nome: a.aparelho.setor_rel?.nome ?? null,
        localidade_nome: a.aparelho.localidade_rel?.nome ?? null,
      } : null,
      setor_nome: a.aparelho?.setor_rel?.nome ?? null,
    })),
    ramais: ramais.map((a) => ({
      alocacao_id: a.id,
      data_inicio: a.data_inicio,
      whatsapp: a.whatsapp,
      item: a.ramal ? {
        ...a.ramal,
        setor_nome: a.ramal.setor_rel?.nome ?? null,
        localidade_nome: a.ramal.localidade_rel?.nome ?? null,
      } : null,
      setor_nome: a.ramal?.setor_rel?.nome ?? null,
    })),
  })
}
