import { resolveMachineMatch } from '@/lib/snow/matching'
import type { SnowMachineMatch } from '@/lib/snow/types'

const machineA: SnowMachineMatch = {
  id: 'maquina-a',
  nome_host: 'HOST-A',
  endereco_ip: '10.0.0.1',
  data_revisao: '2026-05-20',
  setor_rel: { nome: 'IEC' },
  localidade_rel: { nome: 'São Gabriel' },
  alocacoes: [{ colaborador: { nome: 'Nome', setor_rel: { nome: 'TI' } } }],
}

const machineB: SnowMachineMatch = {
  ...machineA,
  id: 'maquina-b',
  nome_host: 'HOST-B',
}

describe('lib/snow/matching', () => {
  it('marca inconsistente quando IP e hostname apontam máquinas diferentes', () => {
    const result = resolveMachineMatch({
      ip: '10.0.0.1',
      hostname: 'HOST-B',
      machineByIp: machineA,
      machineByHostname: machineB,
      tipoRelatorio: 'ativos_nao_inventariados',
    })

    expect(result.status).toBe('inconsistente')
    expect(result.maquina_id).toBeNull()
  })

  it('marca não atendida quando não encontra máquina', () => {
    const result = resolveMachineMatch({
      ip: '10.0.0.2',
      hostname: 'HOST-C',
      machineByIp: null,
      machineByHostname: null,
      tipoRelatorio: 'computadores_fora_organizacao',
    })

    expect(result.status).toBe('nao_atendida')
  })

  it('retorna dados operacionais quando encontra máquina', () => {
    const result = resolveMachineMatch({
      ip: '10.0.0.1',
      hostname: 'HOST-A',
      machineByIp: machineA,
      machineByHostname: machineA,
      tipoRelatorio: 'computadores_a_serem_arquivados',
    })

    expect(result.status).toBe('atendida')
    expect(result.colaborador_alocado).toBe('Nome')
    expect(result.setor_alocado).toBe('TI')
    expect(result.localidade_alocada).toBe('São Gabriel')
  })
})
