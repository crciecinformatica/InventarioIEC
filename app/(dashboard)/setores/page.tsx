'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { Search, Plus, Pencil, Trash2, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { AnimatedSheetFrame } from '@/components/layout/motion-primitives'

interface Setor {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string | null
  _count?: {
    colaboradores: number
    maquinas: number
    notebooks: number
    aparelhos: number
    impressoras: number
    ramais: number
    racks: number
  }
}

export default function SetoresPage() {
  const [data, setData]       = useState<Setor[]>([])
  const [total, setTotal]     = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch]   = useState('')
  const [ativo, setAtivo]     = useState('')

  // Modal de criação/edição
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Setor | null>(null)
  const [formNome, setFormNome]   = useState('')
  const [formDesc, setFormDesc]   = useState('')
  const [formAtivo, setFormAtivo] = useState(true)
  const [saving, setSaving]       = useState(false)

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<Setor | null>(null)
  const [deleting, setDeleting]           = useState(false)

  const cancelledRef = useRef(false)
  function refresh() { setRefreshKey(k => k + 1) }

  useEffect(() => {
    cancelledRef.current = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '30' })
    if (search) params.set('search', search)
    if (ativo)  params.set('ativo', ativo)

    fetch(`/api/setores?${params}`)
      .then(r => r.json())
      .then(json => {
        if (!cancelledRef.current) {
          setData(json.data || [])
          setTotal(json.total || 0)
          setTotalPages(json.totalPages || 1)
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelledRef.current) setLoading(false) })

    return () => { cancelledRef.current = true }
  }, [page, search, ativo, refreshKey])

  function openCreate() {
    setEditing(null); setFormNome(''); setFormDesc(''); setFormAtivo(true); setShowForm(true)
  }

  function openEdit(s: Setor) {
    setEditing(s); setFormNome(s.nome); setFormDesc(s.descricao || ''); setFormAtivo(s.ativo); setShowForm(true)
  }

  async function handleSave() {
    if (!formNome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    try {
      const url    = editing ? `/api/setores/${editing.id}` : '/api/setores'
      const method = editing ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: formNome.trim(), descricao: formDesc || null, ativo: formAtivo }),
      })
      if (res.status === 409) { toast.error('Setor já cadastrado.'); return }
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Setor atualizado!' : 'Setor criado!')
      setShowForm(false)
      refresh()
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(s: Setor) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/setores/${s.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Setor "${s.nome}" desativado.`)
      setConfirmDelete(null)
      refresh()
    } catch {
      toast.error('Erro ao desativar.')
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<Setor, unknown>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200">{row.original.nome}</span>
        </div>
      ),
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => row.original.descricao || <span className="text-slate-400 text-xs">—</span>,
    },
    {
      id: 'uso',
      header: 'Itens vinculados',
      cell: ({ row }) => {
        const c = row.original._count
        if (!c) return '—'
        const total = c.colaboradores + c.maquinas + c.notebooks + c.aparelhos + c.impressoras + c.ramais + c.racks
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{total} itens</span>
            {c.colaboradores > 0 && <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">{c.colaboradores} colab.</span>}
            {c.maquinas > 0 && <span className="text-[10px] bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full">{c.maquinas} máq.</span>}
            {c.notebooks > 0 && <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">{c.notebooks} nb.</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      cell: ({ row }) => <BoolBadge value={row.original.ativo} labelTrue="Ativo" labelFalse="Inativo" />,
    },
    {
      id: 'acoes',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={() => openEdit(row.original)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setConfirmDelete(row.original)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar setor..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <select value={ativo} onChange={e => { setAtivo(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Todos</option>
        <option value="true">Ativos</option>
        <option value="false">Inativos</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Setores" total={total}>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
          <Plus className="w-4 h-4" /> Novo setor
        </button>
      </PageHeader>

      <DataTable columns={columns} data={data} total={total} page={page}
        totalPages={totalPages} onPageChange={setPage} isLoading={loading} filters={filters} />

      <AnimatePresence initial={false}>
        {/* Modal de criação/edição */}
        {showForm && (
          <AnimatedSheetFrame key={editing ? `editar-setor-${editing.id}` : 'criar-setor'} onClose={() => setShowForm(false)}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {editing ? `Editar: ${editing.nome}` : 'Novo Setor'}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="flex-1 p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome *</label>
                <input value={formNome} onChange={e => setFormNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Informática" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição opcional..." />
              </div>
              {editing && (
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <input type="checkbox" checked={formAtivo} onChange={e => setFormAtivo(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Setor ativo</span>
                </label>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Salvar alterações' : 'Criar setor'}
              </button>
            </div>
          </AnimatedSheetFrame>
        )}

        {confirmDelete && (
          <ConfirmDialog
            key={`desativar-setor-${confirmDelete.id}`}
            title="Desativar setor"
            description={`Desativar "${confirmDelete.nome}"? Os itens vinculados não serão afetados.`}
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
