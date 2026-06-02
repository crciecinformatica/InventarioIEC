import { useState } from 'react'
import { toast } from 'sonner'
import {
  useSolicitacaoInventarioConfirm,
  useSolicitacaoInventarioPerfil,
} from '@/components/solicitacoes-inventario/solicitacao-confirm-provider'

const REQUESTABLE_ENTITIES = new Set([
  'maquinas',
  'notebooks',
  'aparelhos',
  'impressoras',
  'ramais',
  'racks',
  'colaboradores',
  'alocacoes_maquinas',
  'alocacoes_notebooks',
  'alocacoes_aparelhos',
  'alocacoes_ramais',
])

export function useCreate(entity: string, onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)
  const confirmSolicitacao = useSolicitacaoInventarioConfirm()
  const perfil = useSolicitacaoInventarioPerfil()

  async function create(data: Record<string, any>) {
    setSaving(true)
    try {
      if (perfil === 'viewer' && REQUESTABLE_ENTITIES.has(entity)) {
        const solicitacao = await confirmSolicitacao()
        if (!solicitacao.confirmed) return null

        const res = await fetch('/api/solicitacoes-inventario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo_recurso: entity,
            acao: entity.startsWith('alocacoes_') ? 'ALLOCATE' : 'CREATE',
            dados_propostos: data,
            comentario: solicitacao.comentario,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Erro ao criar solicitação')
        }
        toast.success('Solicitação enviada para aprovação.')
        onSuccess?.()
        return { __solicitacaoInventario: true, solicitacao: await res.json() }
      }

      const res = await fetch(`/api/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao criar')
      }
      toast.success('Registro criado com sucesso!')
      onSuccess?.()
      return await res.json()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar. Tente novamente.')
      return null
    } finally {
      setSaving(false)
    }
  }

  return { create, saving }
}
