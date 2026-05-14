'use client'

import { usePermission } from '@/hooks/use-permission'

interface AdminOnlyProps {
  children: React.ReactNode
  /**
   * Quando true, renderiza os filhos mas desabilitados + tooltip,
   * ao invés de não renderizar nada.
   * Útil para botões dentro de modais onde o espaço reservado importa.
   */
  fallback?: React.ReactNode
}

/**
 * Renderiza `children` apenas para usuários com perfil 'admin'.
 * Para visitantes, renderiza `fallback` (padrão: null).
 *
 * Uso:
 *   <AdminOnly>
 *     <button onClick={handleDelete}>Excluir</button>
 *   </AdminOnly>
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin, isLoading } = usePermission()
  if (isLoading) return null
  return isAdmin ? <>{children}</> : <>{fallback}</>
}