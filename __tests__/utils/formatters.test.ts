/**
 * Exemplo de Teste Unitário
 * Testa funções utilitárias isoladamente
 */

import { describe, it, expect } from '@jest/globals'

// Exemplo de função a testar
export const formatarData = (data: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(data)
}

export const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

describe('Funções Utilitárias', () => {
  describe('formatarData', () => {
    it('deve formatar data corretamente em pt-BR', () => {
      const data = new Date('2025-04-29')
      const resultado = formatarData(data)
      expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('validarEmail', () => {
    it('deve aceitar email válido', () => {
      expect(validarEmail('usuario@example.com')).toBe(true)
    })

    it('deve rejeitar email sem @', () => {
      expect(validarEmail('usuarioexample.com')).toBe(false)
    })

    it('deve rejeitar email sem domínio', () => {
      expect(validarEmail('usuario@')).toBe(false)
    })
  })
})
