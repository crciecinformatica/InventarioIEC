import type { SnowMachineMatch, SnowProcessedItem, TipoRelatorioSnow } from './types'
import { normalizeHostname, normalizeIp } from './normalizers'

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
  const normalizedHostname = normalizeHostname(hostname)
  const normalizedIp = normalizeIp(ip)

  if (machineByIp && machineByHostname && machineByIp.id !== machineByHostname.id) {
    return {
      ip,
      hostname,
      tipo_arquivo: tipoRelatorio,
      status: 'inconsistente',
      motivo: `IP ${ip ?? '-'} aponta para ${machineByIp.nome_host ?? machineByIp.id}, mas hostname ${hostname ?? '-'} aponta para ${machineByHostname.nome_host ?? machineByHostname.id}`,
      maquina_id: null,
      ...buildMachineOperationalData(null),
    }
  }

  if (machineByIp && normalizedHostname && normalizeHostname(machineByIp.nome_host) !== normalizedHostname) {
    return {
      ip,
      hostname,
      tipo_arquivo: tipoRelatorio,
      status: 'inconsistente',
      motivo: `IP encontrado no inventário, mas hostname SNOW (${hostname}) diverge do hostname cadastrado (${machineByIp.nome_host ?? '-'})`,
      maquina_id: machineByIp.id,
      ...buildMachineOperationalData(machineByIp),
    }
  }

  if (machineByHostname && normalizedIp && normalizeIp(machineByHostname.endereco_ip) !== normalizedIp) {
    return {
      ip,
      hostname,
      tipo_arquivo: tipoRelatorio,
      status: 'inconsistente',
      motivo: `Hostname encontrado no inventário, mas IP SNOW (${ip}) diverge do IP cadastrado (${machineByHostname.endereco_ip ?? '-'})`,
      maquina_id: machineByHostname.id,
      ...buildMachineOperationalData(machineByHostname),
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
