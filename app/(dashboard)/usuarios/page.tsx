'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { UsuarioModal } from '@/components/modals/usuario-modal'
import { Plus, ShieldAlert } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  ativo: boolean
  created_at: string | null
}

const columns: ColumnDef<Usuario>[] = [
  { accessorKey: 'nome', header: 'Nome', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
  { accessorKey: 'email', header: 'E-mail', cell: ({ getValue }) => <span className="text-slate-500 dark:text-slate-400">{getValue() as string}</span> },
  {
    accessorKey: 'perfil', header: 'Perfil',
    cell: ({ getValue }) => {
      const p = getValue() as string
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
          p === 'admin'
            ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          {p === 'admin' ? 'Administrador' : 'Visualizador'}
        </span>
      )
    },
  },
  { accessorKey: 'ativo', header: 'Status', cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} labelTrue="Ativo" labelFalse="Inativo" /> },
  { accessorKey: 'created_at', header: 'Cadastrado em', cell: ({ getValue }) => formatDate(getValue() as string) },
]

export default function UsuariosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [data, setData] = useState<Usuario[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Usuario | null>(null)
  const [showNew, setShowNew] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)
  function refresh() { setRefreshKey(k => k + 1) }

  // Verificar se é admin
  const isAdmin = (session?.user as any)?.perfil === 'admin'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/usuarios')
      if (res.status === 403) { router.push('/'); return }
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
      setTotal(Array.isArray(json) ? json.length : 0)
    } catch {
      toast.error('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Acesso Restrito</h2>
        <p className="text-sm text-slate-500">Apenas administradores podem gerenciar usuários.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Usuários do Sistema" total={total}>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          <Plus className="w-4 h-4" />
          Novo usuário
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
        onRowClick={setSelected}
        isLoading={loading}
      />

      {selected && (
        <UsuarioModal
          usuario={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchData}
        />
      )}

      {showNew && (
        <UsuarioModal
          onClose={() => setShowNew(false)}
          onRefresh={fetchData}
        />
      )}
    </div>
  )
}