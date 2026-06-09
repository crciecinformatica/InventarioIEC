import { parseSnowWorkbook } from './parsers/workbook'
import { buildQuarantineFields } from './quarentena'
import {
  createSnowSolicitation,
  findLastAttendedSnowItem,
  findSnowMachineByHostname,
  findSnowMachineByIp,
} from './repositories'
import { resolveMachineMatch } from './matching'
import { formatDateOnly } from './normalizers'
import type { SnowMetadata, SnowProcessResult, SnowProcessedItem } from './types'

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

  const processed: SnowProcessedItem[] = []

  for (const item of itens) {
    const [machineByIp, machineByHostname] = await Promise.all([
      findSnowMachineByIp(item.ip),
      findSnowMachineByHostname(item.hostname),
    ])

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

    const lastAttended = await findLastAttendedSnowItem(matched.maquina_id)
    const quarantine = buildQuarantineFields(lastAttended?.criado_em ?? null)

    processed.push({
      ...matched,
      status: quarantine.emQuarentena ? 'em_quarentena' : 'atendida',
      motivo: quarantine.emQuarentena
        ? 'Máquina já teve solicitação atendida nos últimos 15 dias'
        : matched.motivo,
      ultima_revisao: formatDateOnly(matched.ultima_revisao),
      data_ultima_solicitacao: quarantine.dataUltimaSolicitacao,
      bloqueado_ate: quarantine.bloqueadoAte,
    })
  }

  const created = await createSnowSolicitation({
    metadata,
    tipoRelatorio,
    itens: processed,
  })

  return buildSnowProcessResult(metadata.nomeArquivo, tipoRelatorio, created.itens as SnowProcessedItem[])
}
