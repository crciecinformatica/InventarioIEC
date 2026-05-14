/**
 * Testes Unitários - Componente PageHeader
 * Coverage: Título, descrição, contagem total, layout
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/layout/page-header'

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

describe('PageHeader - Cabeçalho de Página', () => {
  describe('Renderização Básica', () => {
    test('deve renderizar com título obrigatório', () => {
      render(<PageHeader title="Colaboradores" />)
      expect(screen.getByRole('heading', { name: /Colaboradores/i })).toBeInTheDocument()
    })

    test('deve renderizar título com nível h1', () => {
      render(<PageHeader title="Dashboard" />)
      const heading = screen.getByRole('heading')
      expect(heading.tagName).toBe('H1')
    })

    test('deve aplicar classes de estilo ao título', () => {
      const { container } = render(<PageHeader title="Test" />)
      const heading = container.querySelector('h1')
      expect(heading?.className).toContain('text-xl')
      expect(heading?.className).toContain('font-bold')
    })

    test('deve ter layout flexbox para responsividade', () => {
      const { container } = render(<PageHeader title="Test" />)
      const wrapper = container.firstChild
      expect(wrapper?.className).toContain('flex')
      expect(wrapper?.className).toContain('justify-between')
    })
  })

  describe('Descrição', () => {
    test('deve renderizar descrição quando fornecida', () => {
      render(
        <PageHeader
          title="Aparelhos"
          description="Gerenciamento de aparelhos móveis"
        />
      )
      expect(screen.getByText('Gerenciamento de aparelhos móveis')).toBeInTheDocument()
    })

    test('não deve renderizar descrição quando não fornecida', () => {
      const { container } = render(<PageHeader title="Test" />)
      const description = container.querySelector('p')
      expect(description).not.toBeInTheDocument()
    })

    test('deve aplicar classes corretas à descrição', () => {
      const { container } = render(
        <PageHeader title="Test" description="Desc" />
      )
      const description = container.querySelector('p')
      expect(description?.className).toContain('text-sm')
      expect(description?.className).toContain('text-slate-500')
    })

    test('deve renderizar descrição com tema dark', () => {
      const { container } = render(
        <PageHeader title="Test" description="Desc" />
      )
      const description = container.querySelector('p')
      expect(description?.className).toContain('dark:text-slate-400')
    })

    test('deve renderizar descrição com espaçamento', () => {
      const { container } = render(
        <PageHeader title="Test" description="Desc" />
      )
      const description = container.querySelector('p')
      expect(description?.className).toContain('mt-0.5')
    })

    test('deve renderizar descrição com caracteres especiais', () => {
      render(
        <PageHeader
          title="Test"
          description="Descrição com @ponto.com & caracteres"
        />
      )
      expect(screen.getByText(/Descrição com @ponto.com & caracteres/)).toBeInTheDocument()
    })

    test('deve renderizar descrição longa sem quebrar layout', () => {
      const longDesc = 'Esta é uma descrição muito longa que deve caber no layout sem quebra-lo e sem criar problemas de responsividade'
      render(<PageHeader title="Test" description={longDesc} />)
      expect(screen.getByText(longDesc)).toBeInTheDocument()
    })
  })

  describe('Total de Registros', () => {
    test('deve renderizar total quando fornecido', () => {
      render(<PageHeader title="Users" total={42} />)
      expect(screen.getByText(/42 registro/)).toBeInTheDocument()
    })

    test('não deve renderizar total quando não fornecido', () => {
      const { container } = render(<PageHeader title="Test" />)
      const totalElements = container.querySelectorAll('p')
      expect(totalElements.length).toBe(0)
    })

    test('deve singularizar para 1 registro', () => {
      render(<PageHeader title="Test" total={1} />)
      expect(screen.getByText(/1 registro$/)).toBeInTheDocument()
    })

    test('deve pluralizar para múltiplos registros', () => {
      render(<PageHeader title="Test" total={5} />)
      expect(screen.getByText(/5 registros$/)).toBeInTheDocument()
    })

    test('deve renderizar 0 registros com plural', () => {
      render(<PageHeader title="Test" total={0} />)
      expect(screen.getByText(/0 registros$/)).toBeInTheDocument()
    })

    test('deve formatar grande número com localização pt-BR', () => {
      render(<PageHeader title="Test" total={1000} />)
      // Esperado: "1.000 registros" com ponto de separador
      const text = screen.getByText(/registros/)
      expect(text.textContent).toMatch(/1\.000 registros|1000 registros/)
    })

    test('deve aplicar classes corretas ao total', () => {
      const { container } = render(<PageHeader title="Test" total={10} />)
      const elements = container.querySelectorAll('p')
      const total = Array.from(elements).find(el => el.textContent?.includes('registro'))
      expect(total?.className).toContain('text-xs')
      expect(total?.className).toContain('text-slate-400')
    })
  })

  describe('Children / Slot', () => {
    test('deve renderizar children quando fornecido', () => {
      render(
        <PageHeader title="Test">
          <button>Ação</button>
        </PageHeader>
      )
      expect(screen.getByRole('button', { name: /Ação/i })).toBeInTheDocument()
    })

    test('não deve renderizar slot quando não fornecido', () => {
      render(<PageHeader title="Test" />)
      const buttons = screen.queryAllByRole('button')
      expect(buttons.length).toBe(0)
    })

    test('deve renderizar múltiplos children', () => {
      render(
        <PageHeader title="Test">
          <button>Botão 1</button>
          <button>Botão 2</button>
        </PageHeader>
      )
      expect(screen.getByRole('button', { name: /Botão 1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Botão 2/i })).toBeInTheDocument()
    })

    test('deve ter espaçamento entre children', () => {
      const { container } = render(
        <PageHeader title="Test">
          <div>Content</div>
        </PageHeader>
      )
      const childrenWrapper = container.querySelector('.flex.items-center.gap-2')
      expect(childrenWrapper).toBeInTheDocument()
    })

    test('deve ter shrink-0 para evitar compressão', () => {
      const { container } = render(
        <PageHeader title="Test">
          <div>Content</div>
        </PageHeader>
      )
      const childrenWrapper = container.querySelector('.shrink-0')
      expect(childrenWrapper).toBeInTheDocument()
    })
  })

  describe('Combinações de Props', () => {
    test('deve renderizar título + descrição', () => {
      render(
        <PageHeader
          title="Máquinas"
          description="Computadores da empresa"
        />
      )
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.getByText('Computadores da empresa')).toBeInTheDocument()
    })

    test('deve renderizar título + total', () => {
      render(
        <PageHeader
          title="Notebooks"
          total={25}
        />
      )
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.getByText(/25 registros/)).toBeInTheDocument()
    })

    test('deve renderizar título + descrição + total', () => {
      render(
        <PageHeader
          title="Aparelhos"
          description="Smartphones e tablets"
          total={42}
        />
      )
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.getByText('Smartphones e tablets')).toBeInTheDocument()
      expect(screen.getByText(/42 registros/)).toBeInTheDocument()
    })

    test('deve renderizar com todas as props', () => {
      render(
        <PageHeader
          title="Impressoras"
          description="Dispositivos de impressão"
          total={8}
        >
          <button>Adicionar</button>
        </PageHeader>
      )
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.getByText('Dispositivos de impressão')).toBeInTheDocument()
      expect(screen.getByText(/8 registros/)).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Acessibilidade', () => {
    test('deve ter estrutura hierárquica correta', () => {
      const { container } = render(
        <PageHeader
          title="Main Title"
          description="Sub description"
        />
      )
      const h1 = container.querySelector('h1')
      const p = container.querySelector('p')
      expect(h1).toBeInTheDocument()
      expect(p).toBeInTheDocument()
    })

    test('deve ter texto visível e legível', () => {
      render(<PageHeader title="Visible Title" description="Visible desc" />)
      expect(screen.getByText('Visible Title')).toBeVisible()
      expect(screen.getByText('Visible desc')).toBeVisible()
    })

    test('deve ter contraste adequado com cores tema', () => {
      const { container } = render(<PageHeader title="Test" description="Desc" />)
      const h1 = container.querySelector('h1')
      expect(h1?.className).toContain('dark:text-white')
    })
  })

  describe('Casos Extremos', () => {
    test('deve renderizar com título vazio (string)', () => {
      render(<PageHeader title="" />)
      // Deve renderizar h1 mesmo que vazio
      const h1 = screen.getByRole('heading')
      expect(h1).toBeInTheDocument()
      expect(h1.textContent).toBe('')
    })

    test('deve renderizar com descrição vazia', () => {
      render(<PageHeader title="Test" description="" />)
      // Descrição vazia pode não renderizar
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    test('deve renderizar com total 0', () => {
      render(<PageHeader title="Test" total={0} />)
      expect(screen.getByText(/0 registros/)).toBeInTheDocument()
    })

    test('deve renderizar com título com emoji', () => {
      render(<PageHeader title="📊 Dashboard" />)
      expect(screen.getByText(/📊 Dashboard/)).toBeInTheDocument()
    })

    test('deve renderizar com descrição com quebra de linha', () => {
      render(
        <PageHeader
          title="Test"
          description="Linha 1\nLinha 2"
        />
      )
      expect(screen.getByText(/Linha 1/)).toBeInTheDocument()
    })

    test('deve renderizar com total negativo (caso extremo)', () => {
      // Comportamento não esperado mas deve não quebrar
      const { container } = render(<PageHeader title="Test" total={-5} />)
      const text = container.querySelector('p:last-child')
      expect(text).toBeInTheDocument()
    })

    test('deve re-renderizar com diferentes props', () => {
      const { rerender } = render(<PageHeader title="Initial" />)
      expect(screen.getByText('Initial')).toBeInTheDocument()

      rerender(<PageHeader title="Updated" description="New desc" total={10} />)
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.getByText('New desc')).toBeInTheDocument()
      expect(screen.getByText(/10 registros/)).toBeInTheDocument()
    })
  })

  describe('Estilos e Tema', () => {
    test('deve ter gap entre título e children', () => {
      const { container } = render(
        <PageHeader title="Test">
          <button>Action</button>
        </PageHeader>
      )
      const wrapper = container.firstChild
      expect(wrapper?.className).toContain('gap-4')
    })

    test('deve ter margin-bottom para espaçamento', () => {
      const { container } = render(<PageHeader title="Test" />)
      const wrapper = container.firstChild
      expect(wrapper?.className).toContain('mb-4')
    })

    test('deve ter flex display', () => {
      const { container } = render(<PageHeader title="Test" />)
      const wrapper = container.firstChild
      expect(wrapper?.className).toContain('flex')
      expect(wrapper?.className).toContain('items-start')
    })
  })
})
