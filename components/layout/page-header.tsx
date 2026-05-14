interface PageHeaderProps {
  title: string
  description?: string
  total?: number
  children?: React.ReactNode
}

export function PageHeader({ title, description, total, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        {total !== undefined && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  )
}
