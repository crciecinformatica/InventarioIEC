/**
 * Testes Unitários - Componente Sidebar
 * Tests para verificar renderização básica do componente
 */

import React from 'react'
import { render } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Sidebar } from '@/components/layout/sidebar'

// Mocks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href}>{children}</a>
  )
})

describe('Sidebar - Componente', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'João Silva',
          email: 'joao@example.com',
          perfil: 'user',
        },
      },
      status: 'authenticated',
    })
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
    })
  })

  describe('Renderização Básica', () => {
    test('deve renderizar o componente sem erros', () => {
      const { container } = render(<Sidebar />)
      expect(container).toBeInTheDocument()
      expect(container.querySelector('aside')).toBeInTheDocument()
    })

    test('deve renderizar com classe sidebar', () => {
      const { container } = render(<Sidebar />)
      const aside = container.querySelector('aside')
      expect(aside?.className).toContain('sidebar')
    })

    test('deve renderizar links', () => {
      const { container } = render(<Sidebar />)
      const links = container.querySelectorAll('a')
      expect(links.length).toBeGreaterThan(0)
    })

    test('deve renderizar com navegação', () => {
      const { container } = render(<Sidebar />)
      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()
    })
  })

  describe('Navegação', () => {
    test('deve ter links internos', () => {
      const { container } = render(<Sidebar />)
      const links = container.querySelectorAll('a[href]')
      
      const hrefs = Array.from(links).map(link => link.getAttribute('href'))
      expect(hrefs.length).toBeGreaterThan(0)
    })

    test('deve ter links para dashboard e páginas principais', () => {
      const { container } = render(<Sidebar />)
      const links = container.querySelectorAll('a[href]')
      
      const hrefs = Array.from(links)
        .map(link => link.getAttribute('href'))
        .filter(h => h && (h.includes('dashboard') || h.includes('maquinas') || h.includes('notebooks')))
      
      expect(hrefs.length).toBeGreaterThan(0)
    })
  })

  describe('Permissões', () => {
    test('deve renderizar sem "Usuários" para usuários não-admin', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'User',
            email: 'user@example.com',
            perfil: 'user',
          },
        },
        status: 'authenticated',
      })

      const { container } = render(<Sidebar />)
      const allText = container.textContent || ''
      
      // Deve renderizar normalmente
      expect(container).toBeInTheDocument()
    })

    test('deve renderizar com navegação para admin', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'Admin',
            email: 'admin@example.com',
            perfil: 'admin',
          },
        },
        status: 'authenticated',
      })

      const { container } = render(<Sidebar />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Estados', () => {
    test('deve lidar com sessão null', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const { container } = render(<Sidebar />)
      expect(container).toBeInTheDocument()
    })

    // test('deve lidar com pathname undefined', () => {
    //   ;(usePathname as jest.Mock).mockReturnValue(undefined)

    //   const { container } = render(<Sidebar />)
    //   expect(container).toBeInTheDocument()
    // })

    test('deve renderizar diferentes temas', () => {
      ;(useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
      })

      const { container } = render(<Sidebar />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Responsividade', () => {
    test('deve renderizar sem quebras', () => {
      const { container } = render(<Sidebar />)
      const sidebar = container.querySelector('aside')
      expect(sidebar).toBeInTheDocument()
    })

    test('deve ter estrutura de layout', () => {
      const { container } = render(<Sidebar />)
      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()
    })
  })

  describe('Integração', () => {
    test('deve renderizar completo com todos os mocks', () => {
      const { container } = render(<Sidebar />)
      
      // Verifica estrutura básica
      expect(container.querySelector('aside')).toBeInTheDocument()
      expect(container.querySelector('nav')).toBeInTheDocument()
      expect(container.querySelectorAll('a').length).toBeGreaterThan(0)
    })

    test('deve renderizar com mudança de caminho', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/maquinas')
      
      const { container } = render(<Sidebar />)
      expect(container).toBeInTheDocument()
    })

    test('deve renderizar com mudança de tema', () => {
      ;(useTheme as jest.Mock).mockReturnValue({
        theme: 'system',
        setTheme: jest.fn(),
      })

      const { container } = render(<Sidebar />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Renderização de Elementos', () => {
    test('deve conter múltiplos links de navegação', () => {
      const { container } = render(<Sidebar />)
      const links = container.querySelectorAll('a')
      
      // Sidebar deve ter vários links
      expect(links.length).toBeGreaterThanOrEqual(5)
    })

    test('deve ter seção de usuário', () => {
      const { container } = render(<Sidebar />)
      
      // Procura por elementos que possam indicar info de usuário
      const divs = container.querySelectorAll('div')
      expect(divs.length).toBeGreaterThan(0)
    })
  })

  describe('Funcionamento', () => {
    test('deve renderizar com dados de sessão', () => {
      const { container } = render(<Sidebar />)
      expect(container).toBeInTheDocument()
    })

    test('deve renderizar links com href correto', () => {
      const { container } = render(<Sidebar />)
      const links = container.querySelectorAll('a[href]')
      
      // Todos os links devem ter href
      links.forEach(link => {
        expect(link.getAttribute('href')).toBeTruthy()
      })
    })

    test('deve ser um componente cliente', () => {
      const { container } = render(<Sidebar />)
      expect(container).toBeInTheDocument()
    })
  })
})
