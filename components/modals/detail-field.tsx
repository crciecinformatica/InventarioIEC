interface DetailFieldProps {
  label: string
  value: React.ReactNode
}

export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </dt>
      <dd className="text-sm text-slate-800 dark:text-slate-200 break-words">
        {(value === null || value === undefined || value === '')
          ? <span className="text-slate-300 dark:text-slate-600">—</span>
          : value}
      </dd>
    </div>
  )
}

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        {title}
      </h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        {children}
      </dl>
    </div>
  )
}
