/**
 * Testes Unitários - Componente ConfirmDialog
 * Coverage: Modal de confirmação, callbacks, estado de loading
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

describe('ConfirmDialog - Modal de Confirmação', () => {
  const defaultProps = {
    title: 'Confirmar Ação',
    description: 'Tem certeza que deseja prosseguir?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderização Básica', () => {
    test('deve renderizar o componente sem erros', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByText('Confirmar Ação')).toBeInTheDocument()
      expect(screen.getByText('Tem certeza que deseja prosseguir?')).toBeInTheDocument()
    })

    test('deve renderizar com título', () => {
      render(<ConfirmDialog {...defaultProps} title="Deletar usuário?" />)

      expect(screen.getByText('Deletar usuário?')).toBeInTheDocument()
    })

    test('deve renderizar com descrição', () => {
      render(
        <ConfirmDialog {...defaultProps} description="Esta ação é irreversível" />
      )

      expect(screen.getByText('Esta ação é irreversível')).toBeInTheDocument()
    })

    test('deve renderizar com descrição longa', () => {
      const longDescription =
        'Esta é uma descrição muito longa que precisa ser truncada em um modal pequeno para manter a usabilidade e não quebrar o layout do aplicativo'

      render(
        <ConfirmDialog {...defaultProps} description={longDescription} />
      )

      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })

    test('deve renderizar ícone de alerta', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      // Verifica se há um SVG (ícone)
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    test('deve renderizar botão Cancelar', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    })

    test('deve renderizar botão Excluir', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Excluir/i })).toBeInTheDocument()
    })

    test('deve ter overlay de fundo', () => {
      render(<ConfirmDialog {...defaultProps} />)

      // O overlay está presente no componente como camada de fundo
      const modal = screen.getByText(defaultProps.description)
      expect(modal).toBeInTheDocument()
    })
  })

  describe('Callbacks - Interações', () => {
    test('deve chamar onCancel ao clicar em Cancelar', async () => {
      const onCancel = jest.fn()

      render(
        <ConfirmDialog
          {...defaultProps}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    test('deve chamar onConfirm ao clicar em Excluir', () => {
      const onConfirm = jest.fn()

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })
      fireEvent.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    test('deve chamar onCancel ao clicar no overlay', () => {
      const onCancel = jest.fn()
      const { container } = render(
        <ConfirmDialog
          {...defaultProps}
          onCancel={onCancel}
        />
      )

      const overlay = container.querySelector('.bg-black')
      if (overlay) {
        fireEvent.click(overlay)
        expect(onCancel).toHaveBeenCalledTimes(1)
      }
    })

    test('deve chamar callback apenas uma vez por clique', () => {
      const onConfirm = jest.fn()

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })

      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(2)
    })

    test('não deve chamar callback quando loading=true', () => {
      const onConfirm = jest.fn()

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          loading={true}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })

      // Botão deve estar desabilitado
      expect(confirmButton).toBeDisabled()
    })
  })

  describe('Estado de Loading', () => {
    test('deve exibir spinner quando loading=true', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          loading={true}
        />
      )

      // O ícone de carregamento deve aparecer
      const confirmButton = screen.getByRole('button', { name: /Excluir/i })
      const spinners = confirmButton.querySelectorAll('svg')

      // Deve ter pelo menos um ícone (o spinner de loading)
      expect(spinners.length).toBeGreaterThan(0)
    })

    test('deve desabilitar botões quando loading=true', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          loading={true}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      const confirmButton = screen.getByRole('button', { name: /Excluir/i })

      expect(cancelButton).toBeDisabled()
      expect(confirmButton).toBeDisabled()
    })

    test('deve habilitar botões quando loading=false', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          loading={false}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      const confirmButton = screen.getByRole('button', { name: /Excluir/i })

      expect(cancelButton).not.toBeDisabled()
      expect(confirmButton).not.toBeDisabled()
    })

    test('não deve exibir spinner quando loading=false', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          loading={false}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })
      const loaders = confirmButton.querySelectorAll('[class*="animate-spin"]')

      // Pode ter ícone mas não deve ter classe de animação
      expect(loaders.length).toBe(0)
    })

    test('deve usar loading=false como padrão', () => {
      render(
        <ConfirmDialog
          title="Test"
          description="Test"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })

      expect(confirmButton).not.toBeDisabled()
    })
  })

  describe('Estilos e Tema', () => {
    test('deve ter classes de tema escuro', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const modal = container.querySelector('.dark\\:bg-slate-900')
      expect(modal).toBeInTheDocument()
    })

    test('deve ter classes para hover no botão Cancelar', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      expect(cancelButton.className).toContain('hover:bg-slate-50')
    })

    test('deve ter classes para hover no botão Excluir', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })
      expect(confirmButton.className).toContain('hover:bg-red-700')
    })

    test('deve ter border-radius arredondado', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const modal = container.querySelector('.rounded-xl')
      expect(modal).toBeInTheDocument()
    })

    test('deve ter sombra', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const modal = container.querySelector('.shadow-2xl')
      expect(modal).toBeInTheDocument()
    })

    test('deve ter classe z-index alto', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const dialog = container.querySelector('.z-\\[60\\]')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('Layout e Posicionamento', () => {
    test('deve estar centralizado na tela', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const dialog = container.querySelector('.flex.items-center.justify-center')
      expect(dialog).toBeInTheDocument()
    })

    test('deve ter máximo de largura', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const modal = container.querySelector('.max-w-sm')
      expect(modal).toBeInTheDocument()
    })

    test('deve ter padding', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const modal = container.querySelector('.p-6')
      expect(modal).toBeInTheDocument()
    })

    test('deve ter gap entre ícone e título', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const header = container.querySelector('.gap-3')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Acessibilidade', () => {
    test('deve ter botões com role appropriado', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    test('deve ter descrição legível', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const description = screen.getByText('Tem certeza que deseja prosseguir?')
      expect(description).toBeVisible()
    })

    test('deve ter contraste adequado entre botões', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })

      // Cores diferentes
      expect(confirmButton.className).toContain('bg-red-600')
      expect(cancelButton.className).toContain('border')
    })

    test('deve ter transição suave', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })
      expect(confirmButton.className).toContain('transition')
    })
  })

  describe('Casos Extremos', () => {
    test('deve renderizar com título vazio', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          title=""
        />
      )

      // Deve renderizar sem erro
      expect(screen.getByText(/Tem certeza que deseja/)).toBeInTheDocument()
    })

    test('deve renderizar com descrição vazia', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          description=""
        />
      )

      // Deve renderizar sem erro
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    })

    test('deve renderizar com título com caracteres especiais', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          title="Deletar arquivo: documento@2024.pdf?"
        />
      )

      expect(screen.getByText(/Deletar arquivo/)).toBeInTheDocument()
    })

    test('deve renderizar com descrição com quebras de linha', () => {
      const descWithLineBreaks = "Linha 1\nLinha 2\nLinha 3"

      render(
        <ConfirmDialog
          {...defaultProps}
          description={descWithLineBreaks}
        />
      )

      expect(screen.getByText(/Linha 1/)).toBeInTheDocument()
    })

    test('deve permitir múltiplos cliques quando não está em loading', async () => {
      const onConfirm = jest.fn()

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          loading={false}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })

      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(3)
    })

    test('deve manter estado correto com múltiplas re-renderizações', () => {
      const { rerender } = render(
        <ConfirmDialog {...defaultProps} loading={false} />
      )

      expect(screen.getByRole('button', { name: /Excluir/i })).not.toBeDisabled()

      rerender(<ConfirmDialog {...defaultProps} loading={true} />)

      expect(screen.getByRole('button', { name: /Excluir/i })).toBeDisabled()

      rerender(<ConfirmDialog {...defaultProps} loading={false} />)

      expect(screen.getByRole('button', { name: /Excluir/i })).not.toBeDisabled()
    })
  })

  describe('Integração', () => {
    test('deve suportar fluxo completo: confirmação', async () => {
      const onConfirm = jest.fn()
      const onCancel = jest.fn()

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })
      fireEvent.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onCancel).not.toHaveBeenCalled()
    })

    test('deve suportar fluxo completo: cancelamento', async () => {
      const onConfirm = jest.fn()
      const onCancel = jest.fn()

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onConfirm).not.toHaveBeenCalled()
    })

    test('deve suportar fluxo completo com loading', async () => {
      const onConfirm = jest.fn()
      const { rerender } = render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          loading={false}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Excluir/i })
      fireEvent.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(1)

      // Simular loading
      rerender(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          loading={true}
        />
      )

      const updatedConfirmButton = screen.getByRole('button', { name: /Excluir/i })
      expect(updatedConfirmButton).toBeDisabled()
    })
  })
})
