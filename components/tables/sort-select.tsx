interface SortSelectProps {
  sort: string
  dir: string
  onChange: (sort: string, dir: string) => void
  options?: { value: string; label: string }[]
}

const DEFAULT_OPTIONS = [
  { value: 'created_at:desc', label: 'Mais recentes primeiro' },
  { value: 'created_at:asc',  label: 'Mais antigos primeiro' },
]

export function SortSelect({ sort, dir, onChange, options = DEFAULT_OPTIONS }: SortSelectProps) {
  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <select
      value={`${sort}:${dir}`}
      onChange={(e) => {
        const [s, d] = e.target.value.split(':')
        onChange(s, d)
      }}
      className={inputCls}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}