/**
 * Exemplo de Teste de Componente React
 * Utiliza React Testing Library para testar componentes
 */

'use client'

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Componente exemplo para testar
interface ButtonProps {
  label: string
  onClick?: () => void
  disabled?: boolean
}

export const ButtonExample = ({ label, onClick, disabled = false }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled}>
    {label}
  </button>
)

describe('ButtonExample Component', () => {
  it('deve renderizar o botão com label correto', () => {
    render(<ButtonExample label="Clique aqui" />)
    expect(screen.getByRole('button', { name: /Clique aqui/i })).toBeInTheDocument()
  })

  it('deve chamar onClick quando clicado', async () => {
    const handleClick = jest.fn()
    render(<ButtonExample label="Clique aqui" onClick={handleClick} />)

    const button = screen.getByRole('button', { name: /Clique aqui/i })
    await userEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('deve estar desabilitado quando disabled=true', () => {
    render(<ButtonExample label="Desabilitado" disabled={true} />)
    const button = screen.getByRole('button', { name: /Desabilitado/i })

    expect(button).toBeDisabled()
  })

  it('não deve chamar onClick quando desabilitado', async () => {
    const handleClick = jest.fn()
    render(<ButtonExample label="Desabilitado" onClick={handleClick} disabled={true} />)

    const button = screen.getByRole('button', { name: /Desabilitado/i })
    await userEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })
})
