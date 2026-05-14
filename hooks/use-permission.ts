import { useSession } from 'next-auth/react'

/**
 * Hook central de permissões.
 * Retorna:
 *  - isAdmin   → perfil === 'admin'  (pode criar, editar e excluir)
 *  - isViewer  → perfil === 'viewer' (somente leitura)
 *  - isLoading → sessão ainda carregando
 */
export function usePermission() {
  const { data: session, status } = useSession()
  const perfil = (session?.user as any)?.perfil ?? 'viewer'
  return {
    isAdmin:   perfil === 'admin',
    isViewer:  perfil === 'viewer',
    isLoading: status === 'loading',
    perfil,
  }
}