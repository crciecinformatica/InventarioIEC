'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { ApiRequestToasts } from '@/components/system/api-request-toasts'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ApiRequestToasts />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
