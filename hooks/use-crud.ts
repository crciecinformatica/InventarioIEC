import { useRef, useState } from 'react'
import { toast } from 'sonner'

const UNDO_TIMEOUT_MS = 6000

export function useCrud(entity: string, onSuccess?: () => void) {
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function update(
    id: string,
    data: Record<string, any>,
    opts?: { previousData?: Record<string, any>; label?: string }
  ) {
    setSaving(true)
    try {
      // Se não passou previousData, buscar do servidor antes de salvar
      let previous = opts?.previousData ?? null
      if (!previous) {
        try {
          const r = await fetch(`/api/${entity}/${id}`)
          if (r.ok) previous = await r.json()
        } catch { /* silencioso */ }
      }

      const res = await fetch(`/api/${entity}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()

      onSuccess?.()

      // Cancelar toast anterior se houver
      if (undoRef.current) clearTimeout(undoRef.current)

      const label = opts?.label ?? 'Alteração salva'

      // Mostrar toast com botão desfazer
      if (previous) {
        const toastId = toast(label, {
          description: 'Clique em desfazer para reverter.',
          duration: UNDO_TIMEOUT_MS,
          action: {
            label: 'Desfazer',
            onClick: async () => {
              toast.dismiss(toastId)
              if (undoRef.current) clearTimeout(undoRef.current)
              await revert(id, previous!, label)
            },
          },
          cancel: {
            label: 'Ok',
            onClick: () => toast.dismiss(toastId),
          },
        })
      } else {
        toast.success(label)
      }
    } catch {
      toast.error('Erro ao atualizar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function revert(id: string, previous: Record<string, any>, label: string) {
    try {
      // Remover campos virtuais que a API rejeita
      const {
        alocacoes, alocacoes_ativas, alocacao_ativa,
        setor_rel, setor_nome, created_at, id: _id,
        emprestado_colaborador, emprestado_setor,
        portas_livres, ultima_revisao,
        ...cleanData
      } = previous

      const res = await fetch(`/api/${entity}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      })
      if (!res.ok) throw new Error()
      toast.success(`${label}!`)
      onSuccess?.()
    } catch {
      toast.error('Erro ao reverter alteração.')
    }
  }

  async function remove(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/${entity}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Registro excluído com sucesso!')
      onSuccess?.()
    } catch {
      toast.error('Erro ao excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  return { update, remove, saving, deleting }
}