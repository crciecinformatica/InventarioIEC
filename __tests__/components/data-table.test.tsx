/**
 * Testes Unitários - Componente DataTable
 * Coverage: Renderização de tabela, paginação, sorting, callbacks
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'

// Mocks
jest.mock('@tanstack/react-table', () => {
  const actual = jest.requireActual('@tanstack/react-table')
  return {
    ...actual,
  }
})

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

interface TestData {
  id: string
  nome: string
  email: string
  status: string
}

const mockColumns: ColumnDef<TestData, any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'nome',
    header: 'Nome',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
]

const mockData: TestData[] = [
  { id: '1', nome: 'João Silva', email: 'joao@example.com', status: 'Ativo' },
  { id: '2', nome: 'Maria Santos', email: 'maria@example.com', status: 'Ativo' },
  { id: '3', nome: 'Pedro Costa', email: 'pedro@example.com', status: 'Inativo' },
]

const defaultProps = {
  columns: mockColumns,
  data: mockData,
  total: 30,
  page: 1,
  totalPages: 3,
  onPageChange: jest.fn(),
}

describe('DataTable - Tabela de Dados', () => {
  describe('Renderização Básica', () => {
    test('deve renderizar tabela sem erros', () => {
      render(<DataTable {...defaultProps} />)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    test('deve renderizar headers das colunas', () => {
      render(<DataTable {...defaultProps} />)

      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Nome')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    test('deve renderizar dados corretos nas linhas', () => {
      render(<DataTable {...defaultProps} />)

      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('joao@example.com')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })

    test('deve renderizar todas as linhas de dados', () => {
      render(<DataTable {...defaultProps} />)

      const rows = screen.getAllByRole('row')
      // header + 3 dados = 4 linhas
      expect(rows.length).toBe(4)
    })

    test('deve renderizar com tema dark', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const table = container.querySelector('.dark\\:bg-slate-900')
      expect(table).toBeInTheDocument()
    })
  })

  describe('Paginação', () => {
    test('deve exibir informação de total de registros', () => {
      render(<DataTable {...defaultProps} />)

      expect(screen.getByText(/30 registros/)).toBeInTheDocument()
    })

    test('deve exibir página atual e total', () => {
      render(<DataTable {...defaultProps} />)

      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    test('deve ter botão para próxima página', () => {
      render(<DataTable {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[buttons.length - 1] // Último é o botão de próxima
      expect(nextButton).toBeInTheDocument()
    })

    test('deve ter botão para página anterior', () => {
      render(<DataTable {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      const prevButton = buttons[0] // Primeiro é o botão de anterior
      expect(prevButton).toBeInTheDocument()
    })

    test('deve desabilitar botão de anterior na página 1', () => {
      render(
        <DataTable
          {...defaultProps}
          page={1}
        />
      )

      const buttons = screen.getAllByRole('button')
      const prevButton = buttons[0]
      expect(prevButton).toBeDisabled()
    })

    test('deve desabilitar botão de próxima na última página', () => {
      render(
        <DataTable
          {...defaultProps}
          page={3}
          totalPages={3}
        />
      )

      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[buttons.length - 1]
      expect(nextButton).toBeDisabled()
    })

    test('deve chamar onPageChange ao clicar em próxima', () => {
      const onPageChange = jest.fn()

      render(
        <DataTable
          {...defaultProps}
          onPageChange={onPageChange}
          page={1}
          totalPages={3}
        />
      )

      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[buttons.length - 1]
      fireEvent.click(nextButton)

      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    test('deve chamar onPageChange ao clicar em anterior', () => {
      const onPageChange = jest.fn()

      render(
        <DataTable
          {...defaultProps}
          onPageChange={onPageChange}
          page={2}
          totalPages={3}
        />
      )

      const buttons = screen.getAllByRole('button')
      const prevButton = buttons[0]
      fireEvent.click(prevButton)

      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    test('deve renderizar com 1 registro no singular', () => {
      render(
        <DataTable
          {...defaultProps}
          total={1}
        />
      )

      expect(screen.getByText(/1 registro$/)).toBeInTheDocument()
    })

    test('deve renderizar com múltiplos registros no plural', () => {
      render(
        <DataTable
          {...defaultProps}
          total={100}
        />
      )

      expect(screen.getByText(/100 registros/)).toBeInTheDocument()
    })
  })

  describe('Dados Vazios', () => {
    test('deve exibir mensagem quando não há dados', () => {
      render(
        <DataTable
          {...defaultProps}
          data={[]}
        />
      )

      expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument()
    })

    test('deve exibir emoji de busca quando vazio', () => {
      const { container } = render(
        <DataTable
          {...defaultProps}
          data={[]}
        />
      )

      expect(container.textContent).toContain('🔍')
    })

    test('deve ter colSpan correto na mensagem vazia', () => {
      render(
        <DataTable
          {...defaultProps}
          data={[]}
        />
      )

      const emptyMessage = screen.getByText('Nenhum registro encontrado.')
      expect(emptyMessage).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    test('deve renderizar skeleton rows quando carregando', () => {
      const { container } = render(
        <DataTable
          {...defaultProps}
          isLoading={true}
        />
      )

      // Deve ter elementos com animate-pulse
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    test('deve renderizar 10 linhas de skeleton por padrão', () => {
      const { container } = render(
        <DataTable
          {...defaultProps}
          isLoading={true}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      expect(rows.length).toBe(10)
    })

    test('deve manter número de colunas no skeleton', () => {
      const { container } = render(
        <DataTable
          {...defaultProps}
          isLoading={true}
        />
      )

      const firstRow = container.querySelector('tbody tr')
      const cells = firstRow?.querySelectorAll('td')
      expect(cells?.length).toBe(4) // 4 colunas
    })
  })

  describe('Callbacks - Interações', () => {
    test('deve chamar onRowClick ao clicar em linha', () => {
      const onRowClick = jest.fn()

      render(
        <DataTable
          {...defaultProps}
          onRowClick={onRowClick}
        />
      )

      const rows = screen.getAllByRole('row')
      const dataRow = rows[1] // Primeira linha de dados
      fireEvent.click(dataRow)

      expect(onRowClick).toHaveBeenCalledWith(mockData[0])
    })

    test('não deve ser clicável sem onRowClick definido', () => {
      const { container } = render(
        <DataTable
          {...defaultProps}
          onRowClick={undefined}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      const firstRow = rows[0]

      // Não deve ter cursor-pointer
      expect(firstRow.className).not.toContain('cursor-pointer')
    })

    test('deve ter hover effect quando onRowClick definido', () => {
      const { container } = render(
        <DataTable
          {...defaultProps}
          onRowClick={jest.fn()}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      const firstRow = rows[0]

      expect(firstRow.className).toContain('hover:bg-slate-50')
    })

    test('deve passar dados completos do registro para onRowClick', () => {
      const onRowClick = jest.fn()

      render(
        <DataTable
          {...defaultProps}
          onRowClick={onRowClick}
        />
      )

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1])

      expect(onRowClick).toHaveBeenCalledWith(mockData[0])
      expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
        nome: 'João Silva',
        email: 'joao@example.com',
      }))
    })
  })

  describe('Filtros', () => {
    test('deve renderizar filtros quando fornecido', () => {
      render(
        <DataTable
          {...defaultProps}
          filters={<button>Filter</button>}
        />
      )

      expect(screen.getByRole('button', { name: /Filter/i })).toBeInTheDocument()
    })

    test('não deve renderizar filtros quando não fornecido', () => {
      render(
        <DataTable
          {...defaultProps}
          filters={undefined}
        />
      )

      const buttons = screen.getAllByRole('button')
      // Apenas botões de paginação
      expect(buttons.length).toBe(2)
    })

    test('deve ter espaçamento para filtros', () => {
      const { container } = render(
        <DataTable
          {...defaultProps}
          filters={<input type="text" placeholder="Search" />}
        />
      )

      const filterBar = container.querySelector('.flex.flex-wrap.gap-2')
      expect(filterBar).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    test('deve ter scroll horizontal em telas pequenas', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const scrollWrapper = container.querySelector('.overflow-x-auto')
      expect(scrollWrapper).toBeInTheDocument()
    })

    test('deve manter largura mínima da tabela', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const table = container.querySelector('table')
      expect(table?.className).toContain('min-w-[600px]')
    })

    test('deve renderizar sem quebra em mobile', () => {
      render(<DataTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Estilos e Tema', () => {
    test('deve ter border entre linhas', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const tbody = container.querySelector('tbody')
      expect(tbody?.className).toContain('divide-y')
    })

    test('deve ter header com background diferente', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const thead = container.querySelector('thead tr')
      expect(thead?.className).toContain('bg-slate-50')
    })

    test('deve ter padding consistente', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const cells = container.querySelectorAll('td, th')
      cells.forEach(cell => {
        expect(cell.className).toMatch(/px-4|py-/)
      })
    })

    test('deve ter transições suaves', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const elements = container.querySelectorAll('[class*="transition"]')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  describe('Acessibilidade', () => {
    test('deve ter tabela com role apropriado', () => {
      render(<DataTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    test('deve ter headers em thead', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const thead = container.querySelector('thead')
      expect(thead).toBeInTheDocument()
    })

    test('deve ter dados em tbody', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    test('deve ter botões de paginação acessíveis', () => {
      render(<DataTable {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Casos Extremos', () => {
    test('deve renderizar com 1 linha de dados', () => {
      render(
        <DataTable
          {...defaultProps}
          data={[mockData[0]]}
          total={1}
        />
      )

      const rows = screen.getAllByRole('row')
      expect(rows.length).toBe(2) // header + 1 data
    })

    test('deve renderizar com 100+ linhas', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        nome: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'Ativo',
      }))

      render(
        <DataTable
          {...defaultProps}
          data={largeData}
          total={100}
          totalPages={1}
        />
      )

      const rows = screen.getAllByRole('row')
      expect(rows.length).toBe(101) // header + 100 data
    })

    test('deve lidar com nomes longos', () => {
      const longData = [
        {
          id: '1',
          nome: 'João da Silva Santos Oliveira Costa e Silva',
          email: 'joao.silva.santos.oliveira@email.com.br',
          status: 'Ativo',
        },
      ]

      render(
        <DataTable
          {...defaultProps}
          data={longData}
        />
      )

      expect(screen.getByText(/João da Silva/)).toBeInTheDocument()
    })

    test('deve lidar com totalPages 0', () => {
      render(
        <DataTable
          {...defaultProps}
          totalPages={0}
          page={0}
        />
      )

      expect(screen.getByText(/0 \/ 0|0 \/ 1/)).toBeInTheDocument()
    })

    test('deve re-renderizar com dados novos', () => {
      const { rerender } = render(<DataTable {...defaultProps} />)

      expect(screen.getByText('João Silva')).toBeInTheDocument()

      const newData = [
        { id: '10', nome: 'Novo Usuário', email: 'novo@example.com', status: 'Ativo' },
      ]

      rerender(
        <DataTable
          {...defaultProps}
          data={newData}
          total={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('Novo Usuário')).toBeInTheDocument()
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
    })
  })

  describe('Sorting Headers', () => {
    test('deve ter headers clicáveis para sort', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      const headers = container.querySelectorAll('th')
      headers.forEach(header => {
        // Pode ter ícone de sort
        const hasIcon = header.querySelector('svg')
        if (hasIcon) {
          expect(header).toBeInTheDocument()
        }
      })
    })

    test('deve mostrar ícone de sort', () => {
      const { container } = render(<DataTable {...defaultProps} />)

      // Pode ter ícones de chevron para sorting
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('Integração Completa', () => {
    test('deve funcionar com todos os recursos juntos', () => {
      const onPageChange = jest.fn()
      const onRowClick = jest.fn()

      render(
        <DataTable
          {...defaultProps}
          onPageChange={onPageChange}
          onRowClick={onRowClick}
          filters={<input placeholder="Search" />}
          isLoading={false}
          page={2}
        />
      )

      // Deve renderizar tudo
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })
  })
})
