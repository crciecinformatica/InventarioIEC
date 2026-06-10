import { parseSnowWorkbook } from './parsers/workbook'
import { buildQuarantineFields } from './quarentena'
import {
  createSnowSolicitation,
  findLastAttendedSnowItems,
  findSnowMachinesByHostnames,
  findSnowMachinesByIps,
} from './repositories'
import { resolveMachineMatch } from './matching'
import { formatDateOnly, normalizeHostname, normalizeIp } from './normalizers'
import type { SnowMachineMatch, SnowMetadata, SnowProcessResult, SnowProcessedItem } from './types'

export function buildSnowProcessResult(arquivo: string, tipoRelatorio: SnowProcessResult['tipo_relatorio'], itens: SnowProcessedItem[]): SnowProcessResult {
  const atendidas = itens.filter(item => item.status === 'atendida')
  const naoAtendidas = itens.filter(item => item.status === 'nao_atendida')
  const emQuarentena = itens.filter(item => item.status === 'em_quarentena')
  const inconsistentes = itens.filter(item => item.status === 'inconsistente')
  const descricao = inconsistentes.length > 0
    ? `Relatório processado com ${inconsistentes.length} inconsistência(s) de IP/hostname. Tratar divergências internamente no inventário antes de nova ação operacional.`
    : 'Relatório processado sem inconsistências de IP/hostname.'

  return {
    arquivo,
    tipo_relatorio: tipoRelatorio,
    descricao,
    resumo: {
      total_recebido: itens.length,
      atendidas: atendidas.length,
      nao_atendidas: naoAtendidas.length,
      em_quarentena: emQuarentena.length,
      inconsistentes: inconsistentes.length,
    },
    sections: [
      {
        key: 'atendidas',
        titulo: 'Máquinas atendidas',
        descricao: 'Máquinas encontradas no inventário e liberadas para abertura de chamado no Planner.',
        total: atendidas.length,
        itens: atendidas,
      },
      {
        key: 'inconsistentes',
        titulo: 'Máquinas inconsistentes',
        descricao: inconsistentes.length > 0
          ? 'Máquinas em que o IP e/ou hostname do SNOW divergem do cadastro oficial do inventário.'
          : 'Nenhuma inconsistência de IP/hostname identificada neste relatório.',
        total: inconsistentes.length,
        itens: inconsistentes,
      },
    ],
  }
}

export async function processSnowWorkbook(buffer: Buffer, metadata: SnowMetadata): Promise<SnowProcessResult> {
  const { tipoRelatorio, itens } = parseSnowWorkbook(buffer, metadata)
  const startedAt = Date.now()

  console.info('[snow process] relatório normalizado', {
    arquivo: metadata.nomeArquivo,
    tipoRelatorio,
    total: itens.length,
  })

  const processed: SnowProcessedItem[] = []
  const [machinesByIpList, machinesByHostnameList] = await Promise.all([
    findSnowMachinesByIps(itens.map(item => item.ip).filter((ip): ip is string => Boolean(ip))),
    findSnowMachinesByHostnames(itens.map(item => item.hostname).filter((hostname): hostname is string => Boolean(hostname))),
  ])
  const machinesByIp = new Map<string, SnowMachineMatch>()
  const machinesByHostname = new Map<string, SnowMachineMatch>()

  for (const machine of machinesByIpList) {
    const ip = normalizeIp(machine.endereco_ip)
    if (ip) machinesByIp.set(ip, machine)
  }

  for (const machine of machinesByHostnameList) {
    const hostname = normalizeHostname(machine.nome_host)
    if (hostname) machinesByHostname.set(hostname, machine)
  }

  for (const item of itens) {
    const machineByIp = item.ip ? machinesByIp.get(item.ip) ?? null : null
    const machineByHostname = item.hostname ? machinesByHostname.get(item.hostname) ?? null : null
    const matched = resolveMachineMatch({
      ip: item.ip,
      hostname: item.hostname,
      machineByIp,
      machineByHostname,
      tipoRelatorio,
    })

    if (matched.status !== 'atendida' || !matched.maquina_id) {
      processed.push({
        ...matched,
        ultima_revisao: formatDateOnly(matched.ultima_revisao),
        data_ultima_solicitacao: null,
        bloqueado_ate: null,
      })
      continue
    }

    processed.push({
      ...matched,
      ultima_revisao: formatDateOnly(matched.ultima_revisao),
      data_ultima_solicitacao: null,
      bloqueado_ate: null,
    })
  }

  const lastAttendedByMachine = await findLastAttendedSnowItems(
    processed
      .filter(item => item.status === 'atendida' && item.maquina_id)
      .map(item => item.maquina_id as string)
  )

  for (const item of processed) {
    if (item.status !== 'atendida' || !item.maquina_id) continue
    const quarantine = buildQuarantineFields(lastAttendedByMachine.get(item.maquina_id) ?? null)
    if (!quarantine.emQuarentena) continue

    item.status = 'em_quarentena'
    item.motivo = 'Máquina já teve solicitação atendida nos últimos 15 dias'
    item.data_ultima_solicitacao = quarantine.dataUltimaSolicitacao
    item.bloqueado_ate = quarantine.bloqueadoAte
  }

  const created = await createSnowSolicitation({
    metadata,
    tipoRelatorio,
    itens: processed,
  })

  console.info('[snow process] relatório registrado', {
    arquivo: metadata.nomeArquivo,
    total: processed.length,
    duracaoMs: Date.now() - startedAt,
  })

  return buildSnowProcessResult(metadata.nomeArquivo, tipoRelatorio, created.itens as SnowProcessedItem[])
}
