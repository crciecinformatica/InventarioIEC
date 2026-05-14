/**
 * Testes para lib/audit.ts
 * Funções de auditoria e logging
 */

// Mock de next-auth antes de importar descricaoDiff
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    audit_log: {
      create: jest.fn(),
    },
  },
}))

import { descricaoDiff, TABELA_LABELS } from '@/lib/audit'

describe('lib/audit - descricaoDiff', () => {
  it('deve gerar descrição para mudança de campo simples', () => {
    const anterior = { nome: 'Aparelho 1', status: 'ativo' }
    const novo = { nome: 'Aparelho 2', status: 'ativo' }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('Aparelho 1')
    expect(resultado).toContain('Aparelho 2')
  })

  it('deve ignorar campos de timestamp', () => {
    const anterior = { nome: 'Item 1', created_at: '2025-01-01', updated_at: '2025-01-02' }
    const novo = { nome: 'Item 1', created_at: '2025-01-03', updated_at: '2025-01-04' }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).not.toContain('created_at')
    expect(resultado).not.toContain('updated_at')
  })

  it('deve ignorar campo id', () => {
    const anterior = { id: 1, nome: 'Item 1' }
    const novo = { id: 2, nome: 'Item 2' }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).not.toContain('id:')
    expect(resultado).toContain('nome:')
  })

  it('deve tratar valor null como travessão', () => {
    const anterior = { descricao: null }
    const novo = { descricao: 'Nova descrição' }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('—')
    expect(resultado).toContain('Nova descrição')
  })

  it('deve detectar múltiplas mudanças', () => {
    const anterior = { nome: 'Item 1', tipo: 'A', status: 'ativo' }
    const novo = { nome: 'Item 2', tipo: 'B', status: 'inativo' }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('nome:')
    expect(resultado).toContain('tipo:')
    expect(resultado).toContain('status:')
  })

  it('deve não incluir campos que não mudaram', () => {
    const anterior = { nome: 'Item 1', status: 'ativo', tipo: 'A' }
    const novo = { nome: 'Item 1', status: 'ativo', tipo: 'B' }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('tipo:')
    expect(resultado).not.toContain('nome:')
    expect(resultado).not.toContain('status:')
  })

  it('deve comparar valores JSON corretamente', () => {
    const anterior = { dados: { a: 1, b: 2 } }
    const novo = { dados: { a: 1, b: 3 } }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('dados:')
  })

  it('deve não gerar descrição para objetos idênticos', () => {
    const obj = { nome: 'Item 1', status: 'ativo' }
    const resultado = descricaoDiff(obj, obj)

    expect(resultado).toBe('Sem alterações detectadas')
  })

  it('deve retornar string com mudanças formatadas', () => {
    const anterior = { nome: 'A', valor: '10' }
    const novo = { nome: 'B', valor: '20' }

    const resultado = descricaoDiff(anterior, novo)

    expect(typeof resultado).toBe('string')
    expect(resultado).toContain('→') // Sinal de mudança
  })

  it('deve lidar com campos undefined', () => {
    const anterior = { nome: undefined, status: 'ativo' }
    const novo = { nome: 'Novo', status: 'ativo' }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('nome:')
  })

  it('deve lidar com tipos numéricos', () => {
    const anterior = { id: 1, quantidade: 5 }
    const novo = { id: 1, quantidade: 10 }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('quantidade:')
    expect(resultado).toContain('5')
    expect(resultado).toContain('10')
  })

  it('deve lidar com tipos booleanos', () => {
    const anterior = { ativo: true, deletado: false }
    const novo = { ativo: false, deletado: false }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('ativo:')
    expect(resultado).toContain('true')
    expect(resultado).toContain('false')
  })

  it('deve formatar mudanças com seta direcional', () => {
    const anterior = { status: 'ativo' }
    const novo = { status: 'inativo' }

    const resultado = descricaoDiff(anterior, novo)

    expect(resultado).toContain('→')
  })
})

describe('lib/audit - TABELA_LABELS', () => {
  it('deve ter label para todas as tabelas principais', () => {
    expect(TABELA_LABELS['maquinas']).toBe('Máquinas')
    expect(TABELA_LABELS['notebooks']).toBe('Notebooks')
    expect(TABELA_LABELS['aparelhos']).toBe('Aparelhos')
    expect(TABELA_LABELS['impressoras']).toBe('Impressoras')
  })

  it('deve ter label para alocações', () => {
    expect(TABELA_LABELS['alocacoes_maquinas']).toBe('Alocações de Máquinas')
    expect(TABELA_LABELS['alocacoes_notebooks']).toBe('Alocações de Notebooks')
    expect(TABELA_LABELS['alocacoes_aparelhos']).toBe('Alocações de Aparelhos')
  })

  it('deve ter label para colaboradores e solicitações', () => {
    expect(TABELA_LABELS['colaboradores']).toBe('Colaboradores')
    expect(TABELA_LABELS['solicitacoes']).toBe('Solicitações')
  })

  it('deve ter label em português', () => {
    const labels = Object.values(TABELA_LABELS)
    labels.forEach(label => {
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    })
  })

  it('deve conter pelo menos 10 labels', () => {
    expect(Object.keys(TABELA_LABELS).length).toBeGreaterThanOrEqual(10)
  })
})
