import { useSession } from 'next-auth/react'

/**
 * Hook central de permissões.
 * Retorna:
 *  - isAdmin   → perfil admin/dev  (pode criar, editar e excluir)
 *  - isViewer  → perfil === 'viewer' (somente leitura)
 *  - isLoading → sessão ainda carregando
 */
export function usePermission() {
  const { data: session, status } = useSession()
  const perfil = (session?.user as any)?.perfil ?? 'viewer'
  const isAdmin = perfil === 'admin' || perfil === 'dev'
  const canRequestInventoryChanges = perfil === 'viewer'
  return {
    isAdmin,
    isDev: perfil === 'dev',
    isViewer:  perfil === 'viewer',
    canRequestInventoryChanges,
    isLoading: status === 'loading',
    perfil,
  }
}
