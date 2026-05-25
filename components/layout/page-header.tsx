import type { ReactNode } from 'react'
import { GlobalSearch } from '@/components/layout/global-search'

interface PageHeaderProps {
  title: string
  description?: string
  total?: number
  children?: ReactNode
}

export function PageHeader({ title, description, total, children }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        {total !== undefined && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:min-w-[min(640px,52vw)]">
        <GlobalSearch className="w-full min-w-0 sm:flex-1" />
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
