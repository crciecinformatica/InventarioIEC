/**
 * Testes para lib/utils.ts
 * Funções de formatação de data e mapeamentos
 */

import {
  formatDate,
  formatDateTime,
  mapTipoDispositivo,
  cn,
  TIPO_DISPOSITIVO_MAP,
  TIPO_MOVIMENTACAO_MAP,
  STATUS_SOLICITACAO_MAP,
  PRIORIDADE_MAP,
} from '@/lib/utils'

describe('lib/utils - formatDate', () => {
  it('deve formatar data ISO string corretamente em pt-BR', () => {
    const resultado = formatDate('2025-04-29')
    expect(resultado).toBe('29/04/2025')
  })

  it('deve formatar objeto Date corretamente', () => {
    const data = new Date('2025-04-29T10:00:00Z')
    const resultado = formatDate(data)
    expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('deve retornar travessão para data null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('deve retornar travessão para data undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('deve retornar travessão para data inválida', () => {
    expect(formatDate('data-invalida')).toBe('—')
  })

  it('deve retornar travessão para string vazia', () => {
    expect(formatDate('')).toBe('—')
  })
})

describe('lib/utils - formatDateTime', () => {
  it('deve formatar data e hora corretamente', () => {
    const resultado = formatDateTime('2025-04-29T14:30:00Z')
    expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/)
  })

  it('deve incluir "às" entre data e hora', () => {
    const resultado = formatDateTime('2025-04-29T14:30:00Z')
    expect(resultado).toContain('às')
  })

  it('deve retornar travessão para datetime null', () => {
    expect(formatDateTime(null)).toBe('—')
  })

  it('deve retornar travessão para datetime undefined', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('deve retornar travessão para datetime inválida', () => {
    expect(formatDateTime('datetime-invalida')).toBe('—')
  })
})

describe('lib/utils - mapTipoDispositivo', () => {
  it('deve mapear tipo 1 para Máquina', () => {
    expect(mapTipoDispositivo(1)).toBe('Máquina')
  })

  it('deve mapear tipo 2 para Notebook', () => {
    expect(mapTipoDispositivo(2)).toBe('Notebook')
  })

  it('deve mapear tipo 3 para Aparelho', () => {
    expect(mapTipoDispositivo(3)).toBe('Aparelho')
  })

  it('deve mapear tipo 4 para Impressora', () => {
    expect(mapTipoDispositivo(4)).toBe('Impressora')
  })

  it('deve mapear tipo 5 para Ramal', () => {
    expect(mapTipoDispositivo(5)).toBe('Ramal')
  })

  it('deve mapear tipo 6 para Rack', () => {
    expect(mapTipoDispositivo(6)).toBe('Rack')
  })

  it('deve aceitar string numérica', () => {
    expect(mapTipoDispositivo('1')).toBe('Máquina')
    expect(mapTipoDispositivo('3')).toBe('Aparelho')
  })

  it('deve retornar travessão para tipo null', () => {
    expect(mapTipoDispositivo(null)).toBe('—')
  })

  it('deve retornar travessão para tipo undefined', () => {
    expect(mapTipoDispositivo(undefined)).toBe('—')
  })

  it('deve retornar mensagem genérica para tipo desconhecido', () => {
    expect(mapTipoDispositivo(99)).toBe('Tipo 99')
  })

  it('deve retornar mensagem genérica para string desconhecida', () => {
    expect(mapTipoDispositivo('99')).toBe('Tipo 99')
  })
})

describe('lib/utils - cn (merge de classes)', () => {
  it('deve mesclar classes simples', () => {
    const resultado = cn('px-2', 'py-1')
    expect(resultado).toContain('px-2')
    expect(resultado).toContain('py-1')
  })

  it('deve remover duplicatas de Tailwind', () => {
    const resultado = cn('p-2', 'p-4')
    expect(resultado).toContain('p-4')
    expect(resultado).not.toContain('p-2')
  })

  it('deve ignorar valores falsos', () => {
    const resultado = cn('px-2', false && 'py-1', null, 'py-2')
    expect(resultado).toContain('px-2')
    expect(resultado).toContain('py-2')
  })

  it('deve aceitar array de classes', () => {
    const resultado = cn(['px-2', 'py-1'], 'py-2')
    expect(resultado).toContain('px-2')
  })

  it('deve retornar string vazia para entrada vazia', () => {
    const resultado = cn()
    expect(resultado).toBe('')
  })
})

describe('lib/utils - Constantes de Mapeamento', () => {
  it('deve ter todos os tipos de dispositivo mapeados', () => {
    expect(TIPO_DISPOSITIVO_MAP[1]).toBe('Máquina')
    expect(TIPO_DISPOSITIVO_MAP[6]).toBe('Rack')
    expect(Object.keys(TIPO_DISPOSITIVO_MAP).length).toBe(6)
  })

  it('deve ter todos os tipos de movimentação mapeados', () => {
    expect(TIPO_MOVIMENTACAO_MAP[1]).toBe('Entrada')
    expect(TIPO_MOVIMENTACAO_MAP[6]).toBe('Devolução')
    expect(Object.keys(TIPO_MOVIMENTACAO_MAP).length).toBe(6)
  })

  it('deve ter todos os status de solicitação mapeados', () => {
    expect(STATUS_SOLICITACAO_MAP[1]).toBe('Aberto')
    expect(STATUS_SOLICITACAO_MAP[4]).toBe('Concluído')
    expect(Object.keys(STATUS_SOLICITACAO_MAP).length).toBe(5)
  })

  it('deve ter todas as prioridades mapeadas', () => {
    expect(PRIORIDADE_MAP[1]).toBe('Baixa')
    expect(PRIORIDADE_MAP[5]).toBe('Urgente')
    expect(Object.keys(PRIORIDADE_MAP).length).toBe(5)
  })
})
