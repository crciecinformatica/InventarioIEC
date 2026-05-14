/**
 * Testes para hooks/use-fetch-data.ts
 * Hook para buscar dados com paginação e tratamento de erros
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useFetchData } from '@/hooks/use-fetch-data'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Mocks
jest.mock('next/navigation')
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

describe('hooks/useFetchData', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('deve carregar dados com sucesso', async () => {
    const mockData = {
      data: [
        { id: 1, nome: 'Aparelho 1' },
        { id: 2, nome: 'Aparelho 2' },
      ],
      total: 2,
      totalPages: 1,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    })

    const { result } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.total).toBe(2)
    expect(result.current.totalPages).toBe(1)
  })

  it('deve usar parâmetros de busca corretos', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], total: 0, totalPages: 1 }),
    })

    const { result } = renderHook(() =>
      useFetchData('aparelhos', { search: 'Monitor', status: 'ativo' }, 2, 0)
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
    expect(callUrl).toContain('/api/aparelhos')
    expect(callUrl).toContain('page=2')
    expect(callUrl).toContain('limit=20')
  })

  it('deve exibir erro quando requisição falha', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Erro ao carregar dados. Tentando novamente...'
    )
  })

  it('deve lidar com erro de rede', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    const { result } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(toast.error).toHaveBeenCalled()
  })

  it('deve tentar novamente em caso de 401 até 2 vezes', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0, totalPages: 1 }),
      })

    const { result } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 5000 })

    // Deve ter feito retry
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('deve redirecionar para login após 2 tentativas de 401', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 401 })

    const { result } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    await waitFor(() => {
      // Aguarda até que o push seja chamado
      expect(mockPush).toHaveBeenCalledWith('/login')
    }, { timeout: 5000 })
  })

  it('deve retornar estado inicial quando desmontado', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], total: 0, totalPages: 1 }),
    })

    const { result, unmount } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    unmount()

    // Estado não deve ser atualizado após desmonte
    expect(result.current.data).toEqual([])
  })

  it('deve refetch quando refreshKey muda', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0, totalPages: 1 }),
    })

    const { rerender } = renderHook(
      ({ refreshKey }) => useFetchData('aparelhos', {}, 1, refreshKey),
      { initialProps: { refreshKey: 0 } }
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    // Mudar refreshKey força novo fetch
    rerender({ refreshKey: 1 })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('deve refetch quando page muda', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0, totalPages: 1 }),
    })

    const { rerender } = renderHook(
      ({ page }) => useFetchData('aparelhos', {}, page, 0),
      { initialProps: { page: 1 } }
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    // Mudar page força novo fetch
    rerender({ page: 2 })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('deve aceitar params vazios e null', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], total: 0, totalPages: 1 }),
    })

    const { result } = renderHook(() =>
      useFetchData('aparelhos', { search: '', filter: null as any }, 1, 0)
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Não deve adicionar params vazios à URL
    const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
    expect(callUrl).toMatch(/page=1/)
    expect(callUrl).toMatch(/limit=20/)
  })

  it('deve manter limite de 20 itens por página', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], total: 100, totalPages: 5 }),
    })

    const { result } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
    expect(callUrl).toContain('limit=20')
  })

  it('deve tratar resposta sem data field', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total: 5, totalPages: 1 }), // sem data
    })

    const { result } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual([])
    expect(result.current.total).toBe(5)
  })

  it('deve estar em loading inicialmente', () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() =>
      useFetchData('aparelhos', {}, 1, 0)
    )

    expect(result.current.loading).toBe(true)
  })
})
