'use client'

import { SessionProvider } from 'next-auth/react'
import { ApiRequestToasts } from '@/components/system/api-request-toasts'
import { SolicitacaoConfirmProvider } from '@/components/solicitacoes-inventario/solicitacao-confirm-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SolicitacaoConfirmProvider>
        <ApiRequestToasts />
        {children}
      </SolicitacaoConfirmProvider>
    </SessionProvider>
  )
}
