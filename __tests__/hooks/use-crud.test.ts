/**
 * Testes para hooks/use-crud.ts
 * Hook para operações CRUD (Create, Read, Update, Delete)
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useCrud } from '@/hooks/use-crud'
import { toast } from 'sonner'

// Mock do sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('hooks/useCrud', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('update', () => {
    it('deve fazer requisição PUT com dados corretos', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', name: 'Updated' }),
      })

      const { result } = renderHook(() => useCrud('aparelhos'))

      await act(async () => {
        await result.current.update('1', { nome: 'Novo Nome' })
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/aparelhos/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Novo Nome' }),
      })
    })

    it('deve exibir toast de sucesso ao atualizar', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useCrud('aparelhos'))

      await act(async () => {
        await result.current.update('1', { nome: 'Novo Nome' })
      })

      expect(toast.success).toHaveBeenCalledWith('Registro atualizado com sucesso!')
    })

    it('deve chamar onSuccess callback após atualização bem-sucedida', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
      const onSuccess = jest.fn()

      const { result } = renderHook(() => useCrud('aparelhos', onSuccess))

      await act(async () => {
        await result.current.update('1', { nome: 'Novo Nome' })
      })

      expect(onSuccess).toHaveBeenCalled()
    })

    it('deve exibir toast de erro quando requisição falha', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

      const { result } = renderHook(() => useCrud('aparelhos'))

      await act(async () => {
        await result.current.update('1', { nome: 'Novo Nome' })
      })

      expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar. Tente novamente.')
    })

    it('deve não chamar onSuccess quando requisição falha', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
      const onSuccess = jest.fn()

      const { result } = renderHook(() => useCrud('aparelhos', onSuccess))

      await act(async () => {
        await result.current.update('1', { nome: 'Novo Nome' })
      })

      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('deve atualizar estado saving durante operação', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )

      const { result } = renderHook(() => useCrud('aparelhos'))

      expect(result.current.saving).toBe(false)

      act(() => {
        result.current.update('1', { nome: 'Novo Nome' })
      })

      expect(result.current.saving).toBe(true)

      await waitFor(() => {
        expect(result.current.saving).toBe(false)
      })
    })

    it('deve lidar com erro de rede', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCrud('aparelhos'))

      await act(async () => {
        await result.current.update('1', { nome: 'Novo Nome' })
      })

      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('deve fazer requisição DELETE com ID correto', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useCrud('aparelhos'))

      await act(async () => {
        await result.current.remove('123')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/aparelhos/123', {
        method: 'DELETE',
      })
    })

    it('deve exibir toast de sucesso ao deletar', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useCrud('aparelhos'))

      await act(async () => {
        await result.current.remove('1')
      })

      expect(toast.success).toHaveBeenCalledWith('Registro excluído com sucesso!')
    })

    it('deve chamar onSuccess callback após deleção bem-sucedida', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
      const onSuccess = jest.fn()

      const { result } = renderHook(() => useCrud('aparelhos', onSuccess))

      await act(async () => {
        await result.current.remove('1')
      })

      expect(onSuccess).toHaveBeenCalled()
    })

    it('deve exibir toast de erro quando deleção falha', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const { result } = renderHook(() => useCrud('aparelhos'))

      await act(async () => {
        await result.current.remove('999')
      })

      expect(toast.error).toHaveBeenCalledWith('Erro ao excluir. Tente novamente.')
    })

    it('deve atualizar estado deleting durante operação', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )

      const { result } = renderHook(() => useCrud('aparelhos'))

      expect(result.current.deleting).toBe(false)

      act(() => {
        result.current.remove('1')
      })

      expect(result.current.deleting).toBe(true)

      await waitFor(() => {
        expect(result.current.deleting).toBe(false)
      })
    })

    it('deve lidar com erro de rede na deleção', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCrud('aparelhos'))

      await act(async () => {
        await result.current.remove('1')
      })

      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('estado inicial', () => {
    it('deve retornar saving=false inicialmente', () => {
      const { result } = renderHook(() => useCrud('aparelhos'))
      expect(result.current.saving).toBe(false)
    })

    it('deve retornar deleting=false inicialmente', () => {
      const { result } = renderHook(() => useCrud('aparelhos'))
      expect(result.current.deleting).toBe(false)
    })

    it('deve ter funções update e remove disponíveis', () => {
      const { result } = renderHook(() => useCrud('aparelhos'))
      expect(typeof result.current.update).toBe('function')
      expect(typeof result.current.remove).toBe('function')
    })
  })

  describe('múltiplas entidades', () => {
    it('deve funcionar com diferentes entidades', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      const { result: resultAparelhos } = renderHook(() => useCrud('aparelhos'))
      const { result: resultNotebooks } = renderHook(() => useCrud('notebooks'))

      await act(async () => {
        await resultAparelhos.current.update('1', { nome: 'Aparelho' })
        await resultNotebooks.current.update('2', { nome: 'Notebook' })
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/aparelhos/1',
        expect.anything()
      )
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notebooks/2',
        expect.anything()
      )
    })
  })
})
