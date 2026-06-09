import { buildSnowProcessResult } from '@/lib/snow/service'
import type { SnowProcessedItem } from '@/lib/snow/types'

function item(status: SnowProcessedItem['status']): SnowProcessedItem {
  return {
    ip: null,
    hostname: `HOST-${status}`,
    tipo_arquivo: 'computadores_a_serem_arquivados',
    status,
    motivo: status,
    maquina_id: status === 'nao_atendida' ? null : '940cfee4-3ace-4c3c-9d2d-d74de2ab65b0',
    colaborador_alocado: null,
    setor_alocado: null,
    localidade_alocada: null,
    ultima_revisao: null,
    data_ultima_solicitacao: null,
    bloqueado_ate: null,
  }
}

describe('lib/snow/service', () => {
  it('retorna sections apenas com atendidas e inconsistentes para automação', () => {
    const result = buildSnowProcessResult('snow.xlsx', 'computadores_a_serem_arquivados', [
      item('atendida'),
      item('nao_atendida'),
      item('em_quarentena'),
      item('inconsistente'),
    ])

    expect(result.resumo).toEqual({
      total_recebido: 4,
      atendidas: 1,
      nao_atendidas: 1,
      em_quarentena: 1,
      inconsistentes: 1,
    })
    expect(result.sections.map(section => section.key)).toEqual(['atendidas', 'inconsistentes'])
    expect(result.descricao).toContain('1 inconsistência')
    expect(result.sections.flatMap(section => section.itens).map(sectionItem => sectionItem.status)).toEqual([
      'atendida',
      'inconsistente',
    ])
  })

  it('descreve quando relatório não possui inconsistências', () => {
    const result = buildSnowProcessResult('snow.xlsx', 'computadores_a_serem_arquivados', [
      item('atendida'),
    ])

    expect(result.descricao).toBe('Relatório processado sem inconsistências de IP/hostname.')
    expect(result.sections.find(section => section.key === 'inconsistentes')?.descricao).toContain('Nenhuma inconsistência')
  })
})
