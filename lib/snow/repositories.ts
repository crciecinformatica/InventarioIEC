import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { toPrismaDate } from './normalizers'
import { quarantineStartDate } from './quarentena'
import { SnowProcessingError, type SnowMachineMatch, type SnowMetadata, type SnowProcessedItem, type TipoRelatorioSnow } from './types'

const machineInclude = {
  setor_rel: { select: { nome: true } },
  localidade_rel: { select: { nome: true } },
  alocacoes: {
    where: { ativo: true },
    orderBy: { data_inicio: 'asc' },
    take: 1,
    include: {
      colaborador: {
        select: {
          nome: true,
          setor_rel: { select: { nome: true } },
        },
      },
    },
  },
} satisfies Prisma.maquinasInclude

export async function findSnowMachineByIp(ip: string | null): Promise<SnowMachineMatch | null> {
  if (!ip) return null
  return prisma.maquinas.findFirst({
    where: { endereco_ip: { equals: ip, mode: 'insensitive' } },
    include: machineInclude,
  }) as Promise<SnowMachineMatch | null>
}

export async function findSnowMachineByHostname(hostname: string | null): Promise<SnowMachineMatch | null> {
  if (!hostname) return null
  return prisma.maquinas.findFirst({
    where: { nome_host: { equals: hostname, mode: 'insensitive' } },
    include: machineInclude,
  }) as Promise<SnowMachineMatch | null>
}

export async function findSnowMachinesByIps(ips: string[]): Promise<SnowMachineMatch[]> {
  const uniqueIps = Array.from(new Set(ips.filter(Boolean)))
  if (uniqueIps.length === 0) return []

  return prisma.maquinas.findMany({
    where: {
      OR: uniqueIps.map(ip => ({ endereco_ip: { equals: ip, mode: 'insensitive' } })),
    },
    include: machineInclude,
  }) as Promise<SnowMachineMatch[]>
}

export async function findSnowMachinesByHostnames(hostnames: string[]): Promise<SnowMachineMatch[]> {
  const uniqueHostnames = Array.from(new Set(hostnames.filter(Boolean)))
  if (uniqueHostnames.length === 0) return []

  return prisma.maquinas.findMany({
    where: {
      OR: uniqueHostnames.map(hostname => ({ nome_host: { equals: hostname, mode: 'insensitive' } })),
    },
    include: machineInclude,
  }) as Promise<SnowMachineMatch[]>
}

export async function findLastAttendedSnowItem(maquinaId: string) {
  return prisma.solicitacoes_snow_itens.findFirst({
    where: {
      maquina_id: maquinaId,
      status: 'atendida',
      criado_em: { gte: quarantineStartDate() },
    },
    orderBy: { criado_em: 'desc' },
    select: { criado_em: true },
  }) as Promise<{ criado_em: Date | null } | null>
}

export async function findLastAttendedSnowItems(maquinaIds: string[]) {
  const uniqueIds = Array.from(new Set(maquinaIds.filter(Boolean)))
  if (uniqueIds.length === 0) return new Map<string, Date>()

  const rows = await prisma.solicitacoes_snow_itens.findMany({
    where: {
      maquina_id: { in: uniqueIds },
      status: 'atendida',
      criado_em: { gte: quarantineStartDate() },
    },
    orderBy: { criado_em: 'desc' },
    select: { maquina_id: true, criado_em: true },
  })

  const latestByMachine = new Map<string, Date>()
  for (const row of rows) {
    if (row.maquina_id && row.criado_em && !latestByMachine.has(row.maquina_id)) {
      latestByMachine.set(row.maquina_id, row.criado_em)
    }
  }

  return latestByMachine
}

export async function createSnowSolicitation(params: {
  metadata: SnowMetadata
  tipoRelatorio: TipoRelatorioSnow
  itens: SnowProcessedItem[]
  erroProcessamento?: string | null
}) {
  const { metadata, tipoRelatorio, itens, erroProcessamento = null } = params

  const totalAtendidas = itens.filter(item => item.status === 'atendida').length
  const totalNaoAtendidas = itens.filter(item => item.status === 'nao_atendida').length
  const totalQuarentena = itens.filter(item => item.status === 'em_quarentena').length
  const totalInconsistentes = itens.filter(item => item.status === 'inconsistente').length

  return prisma.solicitacoes_snow.create({
    data: {
      nome_arquivo: metadata.nomeArquivo,
      tipo_arquivo: tipoRelatorio,
      assunto_email: metadata.assuntoEmail ?? null,
      origem_email: metadata.origemEmail ?? null,
      recebido_em: metadata.recebidoEm ?? null,
      total_recebido: itens.length,
      total_atendidas: totalAtendidas,
      total_nao_atendidas: totalNaoAtendidas,
      total_quarentena: totalQuarentena,
      total_inconsistentes: totalInconsistentes,
      status_processamento: erroProcessamento ? 'erro_processamento' : 'processado',
      erro_processamento: erroProcessamento,
      itens: {
        create: itens.map(item => ({
          ip: item.ip,
          hostname: item.hostname,
          tipo_arquivo: item.tipo_arquivo,
          status: item.status,
          motivo: item.motivo,
          maquina_id: item.maquina_id,
          colaborador_alocado: item.colaborador_alocado,
          setor_alocado: item.setor_alocado,
          localidade_alocada: item.localidade_alocada,
          ultima_revisao: toPrismaDate(item.ultima_revisao),
          data_ultima_solicitacao: item.data_ultima_solicitacao,
          bloqueado_ate: item.bloqueado_ate,
        })),
      },
    },
    include: {
      itens: {
        orderBy: { criado_em: 'asc' },
      },
    },
  })
}

export async function markSnowItemAssumed(params: {
  id: string
  atendenteNome: string
  atendenteCodigoPessoa: string
  plannerTaskId?: string | null
  assumidoEm?: Date | null
}) {
  const now = new Date()
  const assumidoEm = params.assumidoEm ?? now
  const plannerTaskId = params.plannerTaskId ?? null

  const rows = await prisma.$queryRaw<Array<{
    id: string
    planner_status: string
    planner_task_id: string | null
    atendente_nome: string | null
    atendente_codigo_pessoa: string | null
    assumido_em: Date | null
    planner_atualizado_em: Date | null
  }>>`
    UPDATE solicitacoes_snow_itens
       SET planner_status = 'assumido',
           atendente_nome = ${params.atendenteNome},
           atendente_codigo_pessoa = ${params.atendenteCodigoPessoa},
           planner_task_id = COALESCE(${plannerTaskId}, planner_task_id),
           assumido_em = ${assumidoEm},
           planner_atualizado_em = ${now}
     WHERE id = ${params.id}::uuid
     RETURNING id,
               planner_status,
               planner_task_id,
               atendente_nome,
               atendente_codigo_pessoa,
               assumido_em,
               planner_atualizado_em
  `

  if (!rows[0]) throw new SnowProcessingError('Item SNOW não encontrado', 404)
  return rows[0]
}

export async function markSnowItemCompleted(params: {
  id: string
  atendenteNome?: string | null
  atendenteCodigoPessoa?: string | null
  plannerTaskId?: string | null
  concluidoEm?: Date | null
  observacao?: string | null
}) {
  const now = new Date()
  const plannerTaskId = params.plannerTaskId ?? null
  const atendenteNome = params.atendenteNome ?? null
  const atendenteCodigoPessoa = params.atendenteCodigoPessoa ?? null
  const concluidoEm = params.concluidoEm ?? now
  const observacao = params.observacao ?? null

  const rows = await prisma.$queryRaw<Array<{
    id: string
    planner_status: string
    planner_task_id: string | null
    atendente_nome: string | null
    atendente_codigo_pessoa: string | null
    assumido_em: Date | null
    concluido_em: Date | null
    conclusao_observacao: string | null
    planner_atualizado_em: Date | null
  }>>`
    UPDATE solicitacoes_snow_itens
       SET planner_status = 'concluido',
           atendente_nome = COALESCE(${atendenteNome}, atendente_nome),
           atendente_codigo_pessoa = COALESCE(${atendenteCodigoPessoa}, atendente_codigo_pessoa),
           planner_task_id = COALESCE(${plannerTaskId}, planner_task_id),
           concluido_em = ${concluidoEm},
           conclusao_observacao = COALESCE(${observacao}, conclusao_observacao),
           planner_atualizado_em = ${now}
     WHERE id = ${params.id}::uuid
     RETURNING id,
               planner_status,
               planner_task_id,
               atendente_nome,
               atendente_codigo_pessoa,
               assumido_em,
               concluido_em,
               conclusao_observacao,
               planner_atualizado_em
  `

  if (!rows[0]) throw new SnowProcessingError('Item SNOW não encontrado', 404)
  return rows[0]
}

export async function registerSnowItemCsc(params: {
  id: string
  cscNumero: string
  cscCriadoEm: Date
}) {
  const now = new Date()

  const rows = await prisma.$queryRaw<Array<{
    id: string
    csc_numero: string | null
    csc_criado_em: Date | null
    csc_atualizado_em: Date | null
    planner_status: string
    planner_task_id: string | null
    planner_atualizado_em: Date | null
  }>>`
    UPDATE solicitacoes_snow_itens
       SET csc_numero = ${params.cscNumero},
           csc_criado_em = ${params.cscCriadoEm},
           csc_atualizado_em = ${now},
           planner_atualizado_em = ${now}
     WHERE id = ${params.id}::uuid
     RETURNING id,
               csc_numero,
               csc_criado_em,
               csc_atualizado_em,
               planner_status,
               planner_task_id,
               planner_atualizado_em
  `

  if (!rows[0]) throw new SnowProcessingError('Item SNOW não encontrado', 404)
  return rows[0]
}
