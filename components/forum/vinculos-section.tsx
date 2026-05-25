'use client'

import { useRouter } from 'next/navigation'
import { Monitor, Laptop, Smartphone, Printer, Phone, Server } from 'lucide-react'

const TIPO_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; href: string }> = {
  maquinas:   { icon: Monitor,    color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950', href: '/maquinas'   },
  notebooks:  { icon: Laptop,     color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950', href: '/notebooks'  },
  aparelhos:  { icon: Smartphone, color: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-950',     href: '/aparelhos'  },
  impressoras:{ icon: Printer,    color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950',   href: '/impressoras'},
  ramais:     { icon: Phone,      color: 'text-emerald-600 dark:text-emerald-400',bg:'bg-emerald-50 dark:bg-emerald-950',href: '/ramais'    },
  racks:      { icon: Server,     color: 'text-slate-600 dark:text-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800',  href: '/racks'      },
}

interface Vinculo { tipo_item: string; item_id: string; item_label: string }

export function VinculosSection({ vinculos }: { vinculos: Vinculo[] }) {
  const router = useRouter()
  if (vinculos.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {vinculos.map((v, i) => {
        const cfg = TIPO_CONFIG[v.tipo_item]
        if (!cfg) return null
        const Icon = cfg.icon
        return (
          <button key={i} type="button"
            onClick={() => router.push(`${cfg.href}?inspect=${v.item_id}`)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${cfg.bg} ${cfg.color} hover:opacity-80 transition`}>
            <Icon className="w-3 h-3 shrink-0" />
            {v.item_label}
          </button>
        )
      })}
    </div>
  )
}