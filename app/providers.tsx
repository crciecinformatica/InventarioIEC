'use client'

import { SessionProvider } from 'next-auth/react'
import { ApiRequestToasts } from '@/components/system/api-request-toasts'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApiRequestToasts />
      {children}
    </SessionProvider>
  )
}
