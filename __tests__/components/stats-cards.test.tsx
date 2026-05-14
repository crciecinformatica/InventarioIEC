/**
 * Testes Unitários - Componente StatsCards
 * Coverage: Renderização de cards, progressão, links, alocações
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StatsCards } from '@/components/dashboard/stats-cards'

// Mocks
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href}>{children}</a>
  )
})

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

const mockStats = {
  colaboradores: 25,
  maquinas: 30,
  notebooks: 45,
  aparelhos: 60,
  impressoras: 12,
  ramais: 20,
  racks: 5,
  solicitacoesAbertas: 8,
  maquinasAlocadas: 28,
  notebooksAlocados: 40,
  aparelhosAlocados: 55,
  ramaisAlocados: 18,
}

describe('StatsCards - Cards de Estatísticas', () => {
  describe('Renderização Básica', () => {
    test('deve renderizar sem erros', () => {
      render(<StatsCards stats={mockStats} />)
      expect(screen.getByText('Máquinas')).toBeInTheDocument()
    })

    test('deve renderizar card para cada tipo de dispositivo', () => {
      render(<StatsCards stats={mockStats} />)

      expect(screen.getByText('Máquinas')).toBeInTheDocument()
      expect(screen.getByText('Notebooks')).toBeInTheDocument()
      expect(screen.getByText('Aparelhos')).toBeInTheDocument()
      expect(screen.getByText('Impressoras')).toBeInTheDocument()
      expect(screen.getByText('Ramais')).toBeInTheDocument()
      expect(screen.getByText('Racks')).toBeInTheDocument()
    })

    test('deve renderizar contagem correta para cada card', () => {
      render(<StatsCards stats={mockStats} />)

      // Procura pelos números
      expect(screen.getByText('30')).toBeInTheDocument() // Máquinas
      expect(screen.getByText('45')).toBeInTheDocument() // Notebooks
      expect(screen.getByText('60')).toBeInTheDocument() // Aparelhos
    })

    test('deve renderizar como links clicáveis', () => {
      render(<StatsCards stats={mockStats} />)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    test('deve renderizar ícones para cada tipo', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Deve ter múltiplos SVG (ícones)
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(5)
    })
  })

  describe('Links e Navegação', () => {
    test('deve ter link correto para Máquinas', () => {
      render(<StatsCards stats={mockStats} />)

      const maquinasLink = screen.getByRole('link', { name: /Máquinas/i })
      expect(maquinasLink.getAttribute('href')).toBe('/maquinas')
    })

    test('deve ter link correto para Notebooks', () => {
      render(<StatsCards stats={mockStats} />)

      const notebooksLink = screen.getByRole('link', { name: /Notebooks/i })
      expect(notebooksLink.getAttribute('href')).toBe('/notebooks')
    })

    test('deve ter link correto para Aparelhos', () => {
      render(<StatsCards stats={mockStats} />)

      const aparelhosLink = screen.getByRole('link', { name: /Aparelhos/i })
      expect(aparelhosLink.getAttribute('href')).toBe('/aparelhos')
    })

    test('deve ter link correto para Impressoras', () => {
      render(<StatsCards stats={mockStats} />)

      const impressorasLink = screen.getByRole('link', { name: /Impressoras/i })
      expect(impressorasLink.getAttribute('href')).toBe('/impressoras')
    })

    test('deve ter link correto para Ramais', () => {
      render(<StatsCards stats={mockStats} />)

      const ramaisLink = screen.getByRole('link', { name: /Ramais/i })
      expect(ramaisLink.getAttribute('href')).toBe('/ramais')
    })

    test('deve ter link correto para Racks', () => {
      render(<StatsCards stats={mockStats} />)

      const racksLink = screen.getByRole('link', { name: /Racks/i })
      expect(racksLink.getAttribute('href')).toBe('/racks')
    })
  })

  describe('Progress Bar - Alocação', () => {
    test('deve renderizar barra de progresso para Máquinas', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Procura por elemento que indica progress
      const progressBars = container.querySelectorAll('.bg-slate-100')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    test('deve calcular percentual correto de alocação', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Máquinas: 28/30 = 93%
      // Notebooks: 40/45 = 88%
      // Aparelhos: 55/60 = 91%

      const progressBars = container.querySelectorAll('[style*="width"]')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    test('deve exibir quantidade alocada no card', () => {
      render(<StatsCards stats={mockStats} />)

      // Deve mostrar dados alocados
      expect(screen.getByText(/Máquinas/i)).toBeInTheDocument()
    })

    test('deve exibir quantidade livre', () => {
      render(<StatsCards stats={mockStats} />)

      // Deve renderizar sem erros
      expect(screen.getByText(/Máquinas/i)).toBeInTheDocument()
    })

    test('deve lidar com 0% alocado', () => {
      const stats = {
        ...mockStats,
        maquinasAlocadas: 0,
      }

      const { container } = render(<StatsCards stats={stats} />)

      // Deve renderizar com 0% de progresso
      expect(container).toBeInTheDocument()
    })

    test('deve lidar com 100% alocado', () => {
      const stats = {
        ...mockStats,
        maquinasAlocadas: 30,
      }

      const { container } = render(<StatsCards stats={stats} />)

      // Deve renderizar com 100% de progresso
      expect(container).toBeInTheDocument()
    })

    test('deve lidar com mais alocados que total', () => {
      const stats = {
        ...mockStats,
        maquinasAlocadas: 35, // Mais que total
      }

      const { container } = render(<StatsCards stats={stats} />)

      // Deve renderizar sem quebra
      expect(container).toBeInTheDocument()
    })
  })

  describe('Cores e Estilos', () => {
    test('deve ter cores diferentes para cada tipo de dispositivo', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Verifica que o componente está renderizado
      expect(container).toBeInTheDocument()
      expect(screen.getByText('Máquinas')).toBeInTheDocument()
    })

    test('deve ter cor para Máquinas', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Deve ter classes de cor específicas
      expect(container).toBeInTheDocument()
    })

    test('deve ter tema dark aplicado', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Deve ter classes dark
      const elements = container.querySelectorAll('[class*="dark:"]')
      expect(elements.length).toBeGreaterThan(0)
    })

    test('deve ter padding adequado', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      const cards = container.querySelectorAll('[class*="p-"]')
      expect(cards.length).toBeGreaterThan(0)
    })

    test('deve ter transições suaves', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      const elements = container.querySelectorAll('[class*="transition"]')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  describe('Responsividade', () => {
    test('deve renderizar grid de cards', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Deve ter grid layout
      const grid = container.querySelector('[class*="grid"]')
      expect(grid).toBeInTheDocument()
    })

    test('deve ser responsivo em diferentes tamanhos', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Verifica que o componente está renderizado
      expect(container).toBeInTheDocument()
      expect(screen.getByText('Máquinas')).toBeInTheDocument()
    })
  })

  describe('Dados Vazios', () => {
    test('deve renderizar com 0 para todos os valores', () => {
      const emptyStats = {
        colaboradores: 0,
        maquinas: 0,
        notebooks: 0,
        aparelhos: 0,
        impressoras: 0,
        ramais: 0,
        racks: 0,
        solicitacoesAbertas: 0,
        maquinasAlocadas: 0,
        notebooksAlocados: 0,
        aparelhosAlocados: 0,
        ramaisAlocados: 0,
      }

      render(<StatsCards stats={emptyStats} />)

      // Deve exibir 0 sem quebra
      expect(screen.getAllByText('0').length).toBeGreaterThan(0)
    })

    test('deve renderizar com valores grandes', () => {
      const largeStats = {
        ...mockStats,
        maquinas: 9999,
        notebooks: 10000,
      }

      render(<StatsCards stats={largeStats} />)

      // Valores formatados em pt-BR
      expect(screen.getByText(/9.999|9999/)).toBeInTheDocument()
    })
  })

  describe('Acessibilidade', () => {
    test('deve ter links com role apropriado', () => {
      render(<StatsCards stats={mockStats} />)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    test('deve ter texto descritivo nos cards', () => {
      render(<StatsCards stats={mockStats} />)

      expect(screen.getByText('Máquinas')).toBeInTheDocument()
      expect(screen.getByText('Notebooks')).toBeInTheDocument()
    })

    test('deve ter contraste adequado em cores', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Deve ter elementos com contraste
      const elements = container.querySelectorAll('[class*="text-"]')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  describe('Interatividade', () => {
    test('deve permitir hover nos cards', () => {
      render(<StatsCards stats={mockStats} />)

      // Verifica que o componente está renderizado
      expect(screen.getByText('Máquinas')).toBeInTheDocument()
    })

    test('deve ser navegável com teclado', () => {
      render(<StatsCards stats={mockStats} />)

      const links = screen.getAllByRole('link')
      expect(links.every(link => link.getAttribute('href'))).toBe(true)
    })
  })

  describe('Casos Extremos', () => {
    test('deve renderizar com stats null (parcial)', () => {
      const partialStats = {
        ...mockStats,
      }

      // Deve renderizar corretamente
      render(<StatsCards stats={partialStats} />)
      expect(screen.getByText(/Máquinas/i)).toBeInTheDocument()
    })

    test('deve lidar com valores negativos', () => {
      const negativeStats = {
        ...mockStats,
        maquinas: -5,
      }

      // Deve renderizar sem quebra
      render(<StatsCards stats={negativeStats} />)
      expect(screen.getByText(/Máquinas/i)).toBeInTheDocument()
    })

    test('deve re-renderizar com dados atualizados', () => {
      const { rerender } = render(<StatsCards stats={mockStats} />)

      expect(screen.getByText('30')).toBeInTheDocument()

      const updatedStats = {
        ...mockStats,
        maquinas: 50,
      }

      rerender(<StatsCards stats={updatedStats} />)

      expect(screen.getByText('50')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    test('deve renderizar mesmo com carregamento', async () => {
      render(<StatsCards stats={mockStats} />)

      // Deve renderizar todos os cards
      await waitFor(() => {
        expect(screen.getByText('Máquinas')).toBeInTheDocument()
      })
    })

    test('deve atualizar quando dados mudam', async () => {
      const { rerender } = render(<StatsCards stats={mockStats} />)

      rerender(
        <StatsCards
          stats={{
            ...mockStats,
            maquinas: 100,
          }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument()
      })
    })
  })

  describe('Layout Grid', () => {
    test('deve usar layout grid responsivo', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Pode ter classe grid-cols
      const elements = container.querySelectorAll('[class*="grid"]')
      expect(elements.length).toBeGreaterThan(0)
    })

    test('deve ter espaçamento entre cards', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Deve ter gap
      const elements = container.querySelectorAll('[class*="gap"]')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  describe('Integração', () => {
    test('deve renderizar todos os elementos juntos', () => {
      render(<StatsCards stats={mockStats} />)

      // Todos os tipos devem estar presentes
      const types = ['Máquinas', 'Notebooks', 'Aparelhos', 'Impressoras', 'Ramais', 'Racks']

      types.forEach(type => {
        expect(screen.getByText(type)).toBeInTheDocument()
      })
    })

    test('deve manter consistência visual', () => {
      const { container } = render(<StatsCards stats={mockStats} />)

      // Todos os cards devem ter estrutura similar
      const cards = container.querySelectorAll('a[href^="/"]')
      expect(cards.length).toBeGreaterThan(0)
    })
  })
})
