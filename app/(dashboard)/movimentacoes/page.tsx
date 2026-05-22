'use client'

import { useState, useMemo, useEffect } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import {
  AuditOverviewPanel,
  type OverviewFilter,
  OverviewFilterToastDescription,
} from '@/components/tables/device-overview-panel'
import { PageHeader } from '@/components/layout/page-header'
import { AuditLogModal } from '@/components/modals/audit-log-modal'
import { useFetchData } from '@/hooks/use-fetch-data'
import { Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { ACAO_COLORS, ACAO_LABELS, TABELAS_OPCOES, type AuditLog } from '@/lib/audit-constants'
import { toast } from 'sonner'
import { useInspectNavigation } from '@/hooks/use-inspect-navigation'

function AcaoBadge({ acao }: { acao: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${ACAO_COLORS[acao] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
      {ACAO_LABELS[acao] || acao}
    </span>
  )
}

export default function MovimentacoesPage() {
  const [page, setPage] = useState(1)
  const [refreshKey] = useState(0)
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const { openInspect, closeInspect } = useInspectNavigation<AuditLog>(setSelected)
  const [tabela, setTabela] = useState('')
  const [acao, setAcao] = useState('')
  const [usuario, setUsuario] = useState('')
  const [overviewData, setOverviewData] = useState<AuditLog[]>([])
  const [overviewTotal, setOverviewTotal] = useState(0)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [activeOverviewFilter, setActiveOverviewFilter] = useState<{
    label: string
    predicate: (item: AuditLog) => boolean
  } | null>(null)
  const [overviewFilterLoading, setOverviewFilterLoading] = useState(false)
  const searchParams = useSearchParams()
  const inspectId = searchParams.get('inspect') 

  const { data, total, totalPages, loading } = useFetchData<AuditLog>(
    'audit-log',
    { tabela, acao, usuario },
    page,
    refreshKey
  )

  const filteredOverviewData = activeOverviewFilter
    ? overviewData.filter(activeOverviewFilter.predicate)
    : null
  const tableData = filteredOverviewData
    ? filteredOverviewData.slice((page - 1) * 20, page * 20)
    : data
  const tableTotal = filteredOverviewData?.length ?? total
  const tableTotalPages = filteredOverviewData ? Math.max(1, Math.ceil(filteredOverviewData.length / 20)) : totalPages

  function applyOverviewFilter(filter: OverviewFilter) {
    if (filter.kind === 'all') {
      setActiveOverviewFilter(null)
      setPage(1)
      toast.success('Filtro do overview removido.')
      return
    }

    const labelToAction = Object.entries(ACAO_LABELS).find(([, label]) => label === filter.value)?.[0] ?? filter.value
    const predicates: Record<string, { label: string; predicate: (item: AuditLog) => boolean }> = {
      'audit-edits': {
        label: 'Edicoes registradas',
        predicate: (item) => item.acao === 'UPDATE' || item.acao === 'EDITAR_ALOCACAO',
      },
      'audit-action': {
        label: `Acao: ${ACAO_LABELS[filter.value ?? ''] ?? filter.value}`,
        predicate: (item) => item.acao === filter.value,
      },
      'audit-action-label': {
        label: `Acao: ${filter.value}`,
        predicate: (item) => item.acao === labelToAction,
      },
      'audit-user': {
        label: `Responsavel: ${filter.value ?? 'Sem responsavel'}`,
        predicate: (item) => (item.usuario_nome || 'Sem responsavel') === filter.value,
      },
    }

    const nextFilter = predicates[filter.kind]
    if (!nextFilter) return

    const description = <OverviewFilterToastDescription label={nextFilter.label} filter={filter} />
    const toastId = toast.loading('Aplicando filtro do overview...', { description })
    setOverviewFilterLoading(true)
    window.setTimeout(() => {
      setActiveOverviewFilter(nextFilter)
      setPage(1)
      setOverviewFilterLoading(false)
      toast.success('Filtro aplicado.', { id: toastId, description })
    }, 120)
  }

  useEffect(() => {
    let cancelled = false
    async function fetchOverview() {
      setOverviewLoading(true)
      try {
        const params = new URLSearchParams({ page: '1', limit: '10000', sort: 'created_at', dir: 'desc' })
        const res = await fetch(`/api/audit-log?${params}`)
        const json = await res.json()
        if (!cancelled) {
          setOverviewData(json.data ?? [])
          setOverviewTotal(json.total ?? 0)
        }
      } catch (error) {
        console.error('[audit overview]', error)
      } finally {
        if (!cancelled) setOverviewLoading(false)
      }
    }

    fetchOverview()
    return () => { cancelled = true }
  }, [refreshKey])

  const columns = useMemo<ColumnDef<AuditLog, unknown>[]>(() => [
    {
      accessorKey: 'created_at',
      header: 'Data/Hora',
      cell: ({ row }) => {
        const d = row.original.created_at
        if (!d) return '—'
        const date = new Date(d)
        return (
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {date.toLocaleDateString('pt-BR')}{' '}
            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
    {
      accessorKey: 'acao',
      header: 'Ação',
      cell: ({ row }) => <AcaoBadge acao={row.original.acao} />,
    },
    {
      accessorKey: 'tabela',
      header: 'Módulo',
      cell: ({ row }) => {
        const label = TABELAS_OPCOES.find(t => t.value === row.original.tabela)?.label
          || row.original.tabela
        return <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
      },
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate block">
          {row.original.descricao || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'usuario_nome',
      header: 'Responsável',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {row.original.usuario_nome || '—'}
        </span>
      ),
    },
  ], [])
  
  useEffect(() => {
  if (!inspectId) return
  fetch(`/api/audit-log/by-id/${inspectId}`)
    .then(r => r.json())
    .then(json => { if (json?.id) setSelected(json) })
    .catch(() => {})
}, [inspectId])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <select
        value={tabela}
        onChange={(e) => { setTabela(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todos os módulos</option>
        {TABELAS_OPCOES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select
        value={acao}
        onChange={(e) => { setAcao(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todas as ações</option>
        <option value="CREATE">Criação</option>
        <option value="UPDATE">Edição</option>
        <option value="DELETE">Exclusão</option>
        <option value="ALOCAR">Alocação</option>
        <option value="DESALOCAR">Desalocação</option>
        <option value="EDITAR_ALOCACAO">Edição de Alocação</option>
      </select>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={usuario}
          onChange={(e) => { setUsuario(e.target.value); setPage(1) }}
          placeholder="Filtrar por responsável..."
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
        />
      </div>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader
        title="Log de Auditoria"
        description="Registro de todas as alterações realizadas no sistema"
        total={total}
      />

      <AuditOverviewPanel
        total={overviewTotal || total}
        items={overviewData}
        isLoading={overviewLoading}
        onFilter={applyOverviewFilter}
      />

      <DataTable
        columns={columns}
        data={tableData}
        total={tableTotal}
        page={page}
        totalPages={tableTotalPages}
        onPageChange={setPage}
        onRowClick={openInspect}
        isLoading={loading || overviewFilterLoading}
        filters={filters}
      />

      {selected && (
        <AuditLogModal
          log={selected}
          onClose={closeInspect}
        />
      )}
    </div>
  )
}
