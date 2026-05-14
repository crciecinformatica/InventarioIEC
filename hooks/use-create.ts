import { useState } from 'react'
import { toast } from 'sonner'

export function useCreate(entity: string, onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  async function create(data: Record<string, any>) {
    setSaving(true)
    try {
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