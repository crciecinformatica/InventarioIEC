import type { SnowMachineMatch, SnowProcessedItem, TipoRelatorioSnow } from './types'

export function buildMachineOperationalData(machine: SnowMachineMatch | null) {
  const activeAllocation = machine?.alocacoes?.[0] ?? null
  const colaborador = activeAllocation?.colaborador ?? null

  return {
    colaborador_alocado: colaborador?.nome ?? null,
    setor_alocado: colaborador?.setor_rel?.nome ?? machine?.setor_rel?.nome ?? null,
    localidade_alocada: machine?.localidade_rel?.nome ?? null,
    ultima_revisao: machine?.data_revisao ?? null,
  }
}

export function resolveMachineMatch(params: {
  ip: string | null
  hostname: string | null
  machineByIp: SnowMachineMatch | null
  machineByHostname: SnowMachineMatch | null
  tipoRelatorio: TipoRelatorioSnow
}): Omit<SnowProcessedItem, 'data_ultima_solicitacao' | 'bloqueado_ate'> {
  const { ip, hostname, machineByIp, machineByHostname, tipoRelatorio } = params

  if (machineByIp && machineByHostname && machineByIp.id !== machineByHostname.id) {
    return {
      ip,
      hostname,
      tipo_arquivo: tipoRelatorio,
      status: 'inconsistente',
      motivo: 'IP e hostname apontam para máquinas diferentes no inventário',
      maquina_id: null,
      ...buildMachineOperationalData(null),
    }
  }

  const machine = machineByIp ?? machineByHostname
  if (!machine) {
    return {
      ip,
      hostname,
      tipo_arquivo: tipoRelatorio,
      status: 'nao_atendida',
      motivo: 'Máquina não encontrada no inventário',
      maquina_id: null,
      ...buildMachineOperationalData(null),
    }
  }

  const matchedBy = machineByIp && machineByHostname
    ? 'IP e hostname'
    : machineByIp
      ? 'IP'
      : 'hostname'

  return {
    ip,
    hostname,
    tipo_arquivo: tipoRelatorio,
    status: 'atendida',
    motivo: `Máquina encontrada por ${matchedBy} e fora da quarentena`,
    maquina_id: machine.id,
    ...buildMachineOperationalData(machine),
  }
}
