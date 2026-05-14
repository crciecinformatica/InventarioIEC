/**
 * Testes Unitários - Componentes Status Badge
 * Coverage: Badge, StatusBadge, PrioridadeBadge, CategoriaBadge, BoolBadge
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Badge,
  StatusBadge,
  StatusSolicitacaoBadge,
  PrioridadeBadge,
  CategoriaBadge,
  BoolBadge,
} from '@/components/dashboard/status-badge'

// Mocks
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  mapStatusSolicitacao: jest.fn(),
  mapPrioridade: jest.fn(),
  STATUS_SOLICITACAO_MAP: {
    1: 'Aberto',
    2: 'Em andamento',
    3: 'Pendente',
    4: 'Concluído',
    5: 'Cancelado',
  },
  PRIORIDADE_MAP: {
    1: 'Baixa',
    2: 'Média',
    3: 'Alta',
    4: 'Crítica',
    5: 'Urgente',
  },
}))

describe('Badge - Componente Base', () => {
  test('deve renderizar badge com conteúdo', () => {
    render(<Badge>Teste</Badge>)
    expect(screen.getByText('Teste')).toBeInTheDocument()
  })

  test('deve aplicar className customizado', () => {
    const { container } = render(
      <Badge className="custom-class">Teste</Badge>
    )
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('custom-class')
  })

  test('deve ter classes base aplicadas', () => {
    const { container } = render(<Badge>Teste</Badge>)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('px-2')
    expect(badge?.className).toContain('text-xs')
    expect(badge?.className).toContain('font-medium')
  })

  test('deve renderizar com children ReactNode', () => {
    render(
      <Badge>
        <span>Conteúdo</span>
      </Badge>
    )
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })
})

describe('StatusSolicitacaoBadge - Status de Solicitações', () => {
  test('deve renderizar status Aberto (1) com cor azul', () => {
    const { container } = render(<StatusSolicitacaoBadge status={1} />)
    expect(screen.getByText('Aberto')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-blue-100')
  })

  test('deve renderizar status Em andamento (2) com cor âmbar', () => {
    const { container } = render(<StatusSolicitacaoBadge status={2} />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-amber-100')
  })

  test('deve renderizar status Pendente (3) com cor laranja', () => {
    const { container } = render(<StatusSolicitacaoBadge status={3} />)
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-orange-100')
  })

  test('deve renderizar status Concluído (4) com cor verde', () => {
    const { container } = render(<StatusSolicitacaoBadge status={4} />)
    expect(screen.getByText('Concluído')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-green-100')
  })

  test('deve renderizar status Cancelado (5) com cor cinza', () => {
    const { container } = render(<StatusSolicitacaoBadge status={5} />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-slate-100')
  })

  test('deve aceitar status como string numérico', () => {
    render(<StatusSolicitacaoBadge status="2" />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  test('deve renderizar status desconhecido com label fallback', () => {
    render(<StatusSolicitacaoBadge status={999} />)
    expect(screen.getByText('Status 999')).toBeInTheDocument()
  })

  test('deve renderizar dash quando status é null', () => {
    const { container } = render(<StatusSolicitacaoBadge status={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve renderizar dash quando status é undefined', () => {
    render(<StatusSolicitacaoBadge status={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve renderizar todos os status válidos', () => {
    const statuses = [1, 2, 3, 4, 5]
    const labels = ['Aberto', 'Em andamento', 'Pendente', 'Concluído', 'Cancelado']

    statuses.forEach((status, idx) => {
      const { unmount } = render(<StatusSolicitacaoBadge status={status} />)
      expect(screen.getByText(labels[idx])).toBeInTheDocument()
      unmount()
    })
  })
})

describe('StatusBadge - Status Genérico', () => {
  test('deve renderizar status Ativo com cor verde', () => {
    const { container } = render(<StatusBadge status="ativo" />)
    expect(screen.getByText('ativo')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-green-100')
  })

  test('deve renderizar status Inativo com cor cinza', () => {
    const { container } = render(<StatusBadge status="inativo" />)
    expect(screen.getByText('inativo')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-slate-100')
  })

  test('deve aceitar maiúsculas e minúsculas', () => {
    const { container: container1 } = render(<StatusBadge status="ATIVO" />)
    expect(screen.getByText('ATIVO')).toBeInTheDocument()
    const badge1 = container1.querySelector('span')
    expect(badge1?.className).toContain('bg-green-100')
  })

  test('deve interpretar string numérica como numero', () => {
    render(<StatusBadge status="2" />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  test('deve interpretar número como status de solicitação', () => {
    render(<StatusBadge status={3} />)
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  test('deve renderizar dash quando status é null', () => {
    render(<StatusBadge status={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve renderizar dash quando status é undefined', () => {
    render(<StatusBadge status={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve usar color padrão para status desconhecido', () => {
    const { container } = render(<StatusBadge status="desconhecido" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-slate-100')
  })
})

describe('PrioridadeBadge - Prioridade de Tarefas', () => {
  test('deve renderizar prioridade Baixa (1) com cor cinza', () => {
    const { container } = render(<PrioridadeBadge prioridade={1} />)
    expect(screen.getByText('Baixa')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-slate-100')
  })

  test('deve renderizar prioridade Média (2) com cor azul', () => {
    const { container } = render(<PrioridadeBadge prioridade={2} />)
    expect(screen.getByText('Média')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-blue-100')
  })

  test('deve renderizar prioridade Alta (3) com cor âmbar', () => {
    const { container } = render(<PrioridadeBadge prioridade={3} />)
    expect(screen.getByText('Alta')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-amber-100')
  })

  test('deve renderizar prioridade Crítica (4) com cor vermelha', () => {
    const { container } = render(<PrioridadeBadge prioridade={4} />)
    expect(screen.getByText('Crítica')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-red-100')
  })

  test('deve renderizar prioridade Urgente (5) com cor vermelha mais escura', () => {
    const { container } = render(<PrioridadeBadge prioridade={5} />)
    expect(screen.getByText('Urgente')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-red-200')
  })

  test('deve aceitar prioridade como string numérica', () => {
    render(<PrioridadeBadge prioridade="3" />)
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  test('deve renderizar prioridade desconhecida com label fallback', () => {
    render(<PrioridadeBadge prioridade={99} />)
    expect(screen.getByText('P99')).toBeInTheDocument()
  })

  test('deve renderizar dash quando prioridade é null', () => {
    render(<PrioridadeBadge prioridade={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve renderizar dash quando prioridade é undefined', () => {
    render(<PrioridadeBadge prioridade={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve renderizar todas as prioridades válidas', () => {
    const prioridades = [1, 2, 3, 4, 5]
    const labels = ['Baixa', 'Média', 'Alta', 'Crítica', 'Urgente']

    prioridades.forEach((prioridade, idx) => {
      const { unmount } = render(<PrioridadeBadge prioridade={prioridade} />)
      expect(screen.getByText(labels[idx])).toBeInTheDocument()
      unmount()
    })
  })
})

describe('CategoriaBadge - Categoria de Solicitação', () => {
  test('deve renderizar categoria Administrativa com cor azul', () => {
    const { container } = render(<CategoriaBadge categoria="Administrativa" />)
    expect(screen.getByText('Administrativa')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-blue-100')
  })

  test('deve renderizar categoria Acadêmica com cor roxa', () => {
    const { container } = render(<CategoriaBadge categoria="Academica" />)
    expect(screen.getByText('Acadêmica')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-violet-100')
  })

  test('deve converter "Academica" para "Acadêmica"', () => {
    render(<CategoriaBadge categoria="Academica" />)
    expect(screen.getByText('Acadêmica')).toBeInTheDocument()
    expect(screen.queryByText('Academica')).not.toBeInTheDocument()
  })

  test('deve renderizar categoria Backup com cor âmbar', () => {
    const { container } = render(<CategoriaBadge categoria="Backup" />)
    expect(screen.getByText('Backup')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-amber-100')
  })

  test('deve renderizar outras categorias com cor padrão', () => {
    const { container } = render(<CategoriaBadge categoria="Outra" />)
    expect(screen.getByText('Outra')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-violet-100')
  })

  test('deve renderizar dash quando categoria é null', () => {
    render(<CategoriaBadge categoria={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve renderizar dash quando categoria é undefined', () => {
    render(<CategoriaBadge categoria={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve renderizar dash quando categoria é string vazia', () => {
    render(<CategoriaBadge categoria="" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

describe('BoolBadge - Valor Booleano', () => {
  test('deve renderizar true com "Sim" em verde', () => {
    const { container } = render(<BoolBadge value={true} />)
    expect(screen.getByText('Sim')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-green-100')
  })

  test('deve renderizar false com "Não" em cinza', () => {
    const { container } = render(<BoolBadge value={false} />)
    expect(screen.getByText('Não')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-slate-100')
  })

  test('deve aceitar labels customizados para true', () => {
    render(<BoolBadge value={true} labelTrue="Ativo" />)
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  test('deve aceitar labels customizados para false', () => {
    render(<BoolBadge value={false} labelFalse="Desativo" />)
    expect(screen.getByText('Desativo')).toBeInTheDocument()
  })

  test('deve aceitar labels customizados para ambos', () => {
    const { unmount } = render(
      <BoolBadge value={true} labelTrue="Habilitado" labelFalse="Desabilitado" />
    )
    expect(screen.getByText('Habilitado')).toBeInTheDocument()
    unmount()

    render(
      <BoolBadge value={false} labelTrue="Habilitado" labelFalse="Desabilitado" />
    )
    expect(screen.getByText('Desabilitado')).toBeInTheDocument()
  })

  test('deve renderizar dash quando value é null', () => {
    render(<BoolBadge value={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve renderizar dash quando value é undefined', () => {
    render(<BoolBadge value={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('deve usar labels customizados com null/undefined', () => {
    render(<BoolBadge value={null} labelTrue="ON" labelFalse="OFF" />)
    // Com null, deve renderizar dash, não os labels customizados
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

describe('Status Badge - Integração e Casos Extremos', () => {
  test('deve lidar com tipos mistos corretamente', () => {
    const { unmount: unmount1 } = render(<StatusBadge status={2} />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    unmount1()

    const { unmount: unmount2 } = render(<StatusBadge status="ativo" />)
    expect(screen.getByText('ativo')).toBeInTheDocument()
    unmount2()

    const { unmount: unmount3 } = render(<StatusBadge status="2" />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    unmount3()
  })

  test('deve renderizar com classes dark mode', () => {
    const { container } = render(<PrioridadeBadge prioridade={4} />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('dark:bg-red-950')
  })

  test('deve ser acessível com text-xs', () => {
    const { container } = render(<Badge>Teste</Badge>)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-xs')
  })
})
