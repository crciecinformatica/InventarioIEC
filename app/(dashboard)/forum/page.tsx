'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Archive, Check, Download, Eye, FileText, FolderOpen, Loader2, Lock, MessageSquare, Pin, Plus, Search, Settings2, Users } from 'lucide-react'
import { ForumEtiquetaBadges } from '@/components/forum/forum-etiquetas'
import { ForumFolderSelect, type ForumPastaSelecionada } from '@/components/forum/forum-folder-select'
import { VinculosSection } from '@/components/forum/vinculos-section'
import { FORUM_ETIQUETA_CONFIG, FORUM_ETIQUETAS, type ForumEtiqueta } from '@/lib/forum'
import { formatDate } from '@/lib/utils'
import { pushInspectHistory } from '@/lib/navigation-context'

type ForumTopico = {
  id: string
  titulo: string
  conteudo: string
  autor_nome: string
  fixado: boolean
  fechado: boolean
  views: number
  created_at: string | null
  etiquetas: Array<{ etiqueta: ForumEtiqueta }>
  vinculos: Array<{ tipo_item: string; item_id: string; item_label: string }>
  arquivos: Array<{ id: string; nome_original: string; tipo_arquivo: string }>
  pastas?: Array<{ pasta?: { id: string; nome: string; _count?: { arquivos?: number; filhos?: number } } }>
  comentarios: Array<{ id: string; autor_nome: string; conteudo: string; created_at: string | null }>
  _count?: { comentarios?: number; arquivos?: number }
}
type PipelinePasta = {
  id: string
  etiqueta: ForumEtiqueta
  pasta: ForumPastaSelecionada & {
    totalArquivos?: number
    arquivos?: Array<{ id: string; nome_original: string; tipo_arquivo: string; tamanho_bytes: number; url_publica: string }>
  }
}

const filtros = ['todos', 'fixados', 'meus', 'vinculados'] as const
const filtroLabel: Record<typeof filtros[number], string> = {
  todos: 'Todos',
  fixados: 'Fixados',
  meus: 'Meus tópicos',
  vinculados: 'Com itens',
}

export default function ForumPage() {
  const [data, setData] = useState<ForumTopico[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<typeof filtros[number]>('todos')
  const [etiqueta, setEtiqueta] = useState<ForumEtiqueta | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pipelineCounts, setPipelineCounts] = useState<{ all: number; etiquetas: Record<string, number> }>({ all: 0, etiquetas: {} })
  const [pipelinePastas, setPipelinePastas] = useState<PipelinePasta[]>([])
  const [editingPipelinePastas, setEditingPipelinePastas] = useState(false)
  const [pipelinePastasDraft, setPipelinePastasDraft] = useState<ForumPastaSelecionada[]>([])
  const [savingPipelinePastas, setSavingPipelinePastas] = useState(false)
  const cancelledRef = useRef(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    cancelledRef.current = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20', filtro })
    if (search) params.set('search', search)
    if (etiqueta) params.set('etiqueta', etiqueta)

    fetch(`/api/forum?${params}`)
      .then(r => r.json())
      .then(json => {
        if (!cancelledRef.current) {
          const rows = json.data || []
          setData(rows)
          setTotal(json.total || 0)
          setPipelineCounts(json.counts || { all: json.total || 0, etiquetas: {} })
          setTotalPages(json.totalPages || 1)
          setSelectedId(current => current && rows.some((item: ForumTopico) => item.id === current) ? current : rows[0]?.id ?? null)
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelledRef.current) setLoading(false) })

    return () => { cancelledRef.current = true }
  }, [page, search, filtro, etiqueta])

  useEffect(() => {
    if (!etiqueta) {
      setPipelinePastas([])
      setPipelinePastasDraft([])
      setEditingPipelinePastas(false)
      return
    }

    let cancelled = false
    fetch(`/api/forum/pipeline-pastas?etiqueta=${etiqueta}`)
      .then(res => res.ok ? res.json() : { data: [] })
      .then(json => {
        if (cancelled) return
        const rows = Array.isArray(json.data) ? json.data : []
        setPipelinePastas(rows)
        setPipelinePastasDraft(rows.map((item: PipelinePasta) => item.pasta).filter(Boolean))
      })
      .catch(() => {
        if (!cancelled) {
          setPipelinePastas([])
          setPipelinePastasDraft([])
        }
      })
    return () => { cancelled = true }
  }, [etiqueta])

  useEffect(() => {
    pushInspectHistory(window.sessionStorage, {
      path: '/forum',
      inspectId: 'forum',
      type: 'forum',
      label: 'Fórum',
      title: 'Fórum',
      subtitle: 'Discussões e soluções do setor de TI',
      href: '/forum',
      timestamp: Date.now(),
    })
  }, [])

  const selected = useMemo(() => data.find(item => item.id === selectedId) ?? data[0], [data, selectedId])
  const autores = useMemo(() => Array.from(new Set(data.map(item => item.autor_nome).filter(Boolean))).slice(0, 8), [data])
  const ativosCount = selected?.vinculos?.length ?? 0
  const selectedPastasCount = selected?.pastas?.length ?? 0

  function selectFiltro(next: typeof filtros[number]) {
    setFiltro(next)
    setPage(1)
  }

  function selectEtiqueta(next: ForumEtiqueta | '') {
    setEtiqueta(current => current === next ? '' : next)
    setPage(1)
  }

  async function salvarPastasPipeline() {
    if (!etiqueta) return
    setSavingPipelinePastas(true)
    try {
      const res = await fetch('/api/forum/pipeline-pastas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etiqueta,
          pasta_ids: pipelinePastasDraft.map(pasta => pasta.id),
        }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      const rows = Array.isArray(json.data)
        ? json.data.map((item: any) => ({ ...item, etiqueta, pasta: item.pasta }))
        : []
      setPipelinePastas(rows)
      setPipelinePastasDraft(rows.map((item: PipelinePasta) => item.pasta).filter(Boolean))
      setEditingPipelinePastas(false)
    } catch (error) {
      console.error(error)
    } finally {
      setSavingPipelinePastas(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-screen-2xl gap-5 p-4 md:p-6 xl:grid-cols-[250px_minmax(0,1fr)_320px]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:h-[calc(100vh-6rem)]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Fórum</h1>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">Discussões e soluções do setor de TI</p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-400">{pipelineCounts.all || total}</span>
            </div>
            <Link href="/forum/novo" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Novo tópico
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline</p>
            <button
              type="button"
              onClick={() => selectEtiqueta('')}
              className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${!etiqueta ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span>Todos os processos</span>
              <span className="text-xs opacity-80">{pipelineCounts.all}</span>
            </button>
            {FORUM_ETIQUETAS.map(key => {
              const cfg = FORUM_ETIQUETA_CONFIG[key]
              const Icon = cfg.icon
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectEtiqueta(key)}
                  className={`mb-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${etiqueta === key ? 'bg-slate-100 text-slate-950' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{cfg.label}</span>
                  </span>
                  <span className="text-xs opacity-70">{pipelineCounts.etiquetas?.[key] ?? 0}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-xl shadow-black/10">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={event => { setSearch(event.target.value); setPage(1) }}
                  placeholder="Buscar tópicos, ativos, autores ou processos..."
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {filtros.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectFiltro(item)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${filtro === item ? 'bg-blue-600 text-white' : 'border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    {filtroLabel[item]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence initial={false} mode="popLayout">
            {etiqueta && (
              <motion.div
                key={`pipeline-assets-${etiqueta}`}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <PipelineFoldersPanel
                  etiqueta={etiqueta}
                  assets={pipelinePastas}
                  editing={editingPipelinePastas}
                  draft={pipelinePastasDraft}
                  saving={savingPipelinePastas}
                  onDraftChange={setPipelinePastasDraft}
                  onEdit={() => setEditingPipelinePastas(true)}
                  onCancel={() => {
                    setPipelinePastasDraft(pipelinePastas.map(item => item.pasta).filter(Boolean))
                    setEditingPipelinePastas(false)
                  }}
                  onSave={salvarPastasPipeline}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 py-16 text-center text-slate-500">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">Nenhum tópico encontrado.</p>
            </div>
          ) : (
            <motion.div layout className="space-y-4" transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
              {data.map((topico) => {
                const primary = topico.etiquetas?.[0]?.etiqueta ?? 'comentario'
                const cfg = FORUM_ETIQUETA_CONFIG[primary]
                return (
                  <motion.article
                    layout="position"
                    key={topico.id}
                    onMouseEnter={() => setSelectedId(topico.id)}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={`group relative overflow-hidden rounded-2xl border bg-slate-900/80 shadow-xl shadow-black/10 transition-colors hover:border-blue-700/60 ${selected?.id === topico.id ? 'border-blue-600/70' : 'border-slate-800'}`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cfg.accent}`} />
                    <Link href={`/forum/${topico.id}`} className="block p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {topico.fixado && <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/70 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-200"><Pin className="h-3 w-3" />Fixado</span>}
                            {topico.fechado && <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-300"><Lock className="h-3 w-3" />Fechado</span>}
                            <ForumEtiquetaBadges etiquetas={topico.etiquetas} />
                          </div>
                          <h2 className="text-xl font-bold leading-tight text-white transition group-hover:text-blue-200">{topico.titulo}</h2>
                          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-400">{topico.conteudo}</p>
                          <VinculosSection vinculos={topico.vinculos ?? []} compact />
                          {topico.pastas && topico.pastas.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {topico.pastas.slice(0, 3).map(item => item.pasta).filter(Boolean).map(pasta => (
                                <span
                                  key={pasta!.id}
                                  className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-violet-900 bg-violet-950 px-2.5 py-1 text-xs font-semibold text-violet-200"
                                >
                                  <FolderOpen className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{pasta!.nome}</span>
                                </span>
                              ))}
                              {topico.pastas.length > 3 && (
                                <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-400">
                                  +{topico.pastas.length - 3} pasta(s)
                                </span>
                              )}
                            </div>
                          )}
                          {topico.comentarios?.length > 0 && (
                            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Última movimentação</p>
                              <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
                                <span className="font-semibold text-slate-300">{topico.comentarios[0].autor_nome}:</span> {topico.comentarios[0].conteudo}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="grid min-w-[150px] grid-cols-3 gap-2 text-center md:block md:space-y-3 md:text-right">
                          <Metric icon={MessageSquare} value={topico._count?.comentarios ?? 0} label="coment." />
                          <Metric icon={Eye} value={topico.views ?? 0} label="views" />
                          <Metric icon={FileText} value={(topico._count?.arquivos ?? topico.arquivos?.length ?? 0) + (topico.pastas?.length ?? 0)} label="anexos" />
                          <p className="col-span-3 text-xs leading-relaxed text-slate-500 md:pt-2">
                            <span className="block font-semibold text-slate-300">{topico.autor_nome}</span>
                            {formatDate(topico.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                )
              })}
            </motion.div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40">
                Anterior
              </button>
              <span className="text-xs text-slate-500">{page} / {totalPages}</span>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40">
                Próximo
              </button>
            </div>
          )}
        </main>

        <aside className="hidden space-y-4 xl:block xl:sticky xl:top-6 xl:h-[calc(100vh-6rem)]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contexto selecionado</p>
            {selected ? (
              <div className="mt-3 space-y-4">
                <div>
                  <ForumEtiquetaBadges etiquetas={selected.etiquetas} />
                  <h3 className="mt-3 text-lg font-bold leading-tight text-white">{selected.titulo}</h3>
                  <p className="mt-2 line-clamp-5 text-sm leading-relaxed text-slate-400">{selected.conteudo}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <PanelMetric icon={MessageSquare} label="Comentários" value={selected._count?.comentarios ?? 0} />
                  <PanelMetric icon={Archive} label="Ativos" value={ativosCount} />
                  <PanelMetric icon={FileText} label="Anexos" value={(selected._count?.arquivos ?? selected.arquivos?.length ?? 0) + selectedPastasCount} />
                </div>
                <VinculosSection vinculos={selected.vinculos ?? []} />
                {selected.pastas && selected.pastas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pastas</p>
                    {selected.pastas.slice(0, 4).map(item => item.pasta).filter(Boolean).map(pasta => (
                      <Link
                        key={pasta!.id}
                        href={`/forum/documentos?pasta=${pasta!.id}`}
                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-700 hover:text-white"
                      >
                        <FolderOpen className="h-4 w-4 shrink-0 text-violet-300" />
                        <span className="min-w-0 flex-1 truncate">{pasta!.nome}</span>
                      </Link>
                    ))}
                  </div>
                )}
                <Link href={`/forum/${selected.id}`} className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white">
                  Abrir processo completo
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Selecione um card para ver o resumo.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Autores nesta visão</p>
            <div className="space-y-2">
              {autores.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum autor no filtro atual.</p>
              ) : autores.map(autor => (
                <div key={autor} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="truncate text-sm text-slate-300">{autor}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PipelineFoldersPanel({
  etiqueta,
  assets,
  editing,
  draft,
  saving,
  onDraftChange,
  onEdit,
  onCancel,
  onSave,
}: {
  etiqueta: ForumEtiqueta
  assets: PipelinePasta[]
  editing: boolean
  draft: ForumPastaSelecionada[]
  saving: boolean
  onDraftChange: (pastas: ForumPastaSelecionada[]) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}) {
  const cfg = FORUM_ETIQUETA_CONFIG[etiqueta]
  const arquivos = assets.flatMap(item => item.pasta?.arquivos ?? [])
  return (
    <section className="rounded-2xl border border-violet-800/50 bg-violet-950/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">Pastas relacionadas</p>
          <h2 className="text-lg font-bold text-white">Arquivos de {cfg.label.toLowerCase()}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-700/60 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-900/50"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Vincular pastas
          </button>
          <Link href="/forum/documentos" className="rounded-xl border border-violet-700/60 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-900/50">
            Ver documentos
          </Link>
        </div>
      </div>

      {editing && (
        <div className="mb-4 rounded-xl border border-violet-900/70 bg-slate-950/70 p-3">
          <ForumFolderSelect
            value={draft}
            onChange={onDraftChange}
            title={`Pastas do pipeline ${cfg.label}`}
            description="Escolha uma ou mais pastas já criadas. Elas aparecerão fixadas no topo deste pipeline."
            placeholder="Buscar pasta para vincular ao pipeline..."
            clearLabel="Limpar seleção"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Salvar pastas
            </button>
          </div>
        </div>
      )}

      {assets.length > 0 ? (
        <div className="mb-3 grid gap-2 md:grid-cols-2">
          {assets.map(item => (
            <Link key={item.id} href={`/forum/documentos?pasta=${item.pasta.id}`} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition hover:border-violet-700">
              <FolderOpen className="h-5 w-5 text-violet-300" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-100">{item.pasta.nome}</span>
                <span className="text-xs text-slate-500">{item.pasta.totalArquivos ?? item.pasta._count?.arquivos ?? 0} arquivo(s)</span>
              </span>
            </Link>
          ))}
        </div>
      ) : !editing ? (
        <div className="mb-3 rounded-xl border border-dashed border-violet-900/60 bg-slate-950/50 p-4 text-sm text-slate-400">
          Nenhuma pasta vinculada a este pipeline.
        </div>
      ) : null}

      {arquivos.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {arquivos.slice(0, 6).map(arquivo => (
            <a key={arquivo.id} href={arquivo.url_publica} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition hover:border-violet-700">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{arquivo.nome_original}</span>
              <Download className="h-4 w-4 text-slate-500" />
            </a>
          ))}
        </div>
      )}
    </section>
  )
}

function Metric({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-950/60 px-2 py-2 text-xs font-semibold text-slate-400 md:justify-end md:border-0 md:bg-transparent md:p-0">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-slate-200">{value}</span>
      <span className="hidden md:inline">{label}</span>
    </span>
  )
}

function PanelMetric({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <Icon className="mb-2 h-4 w-4 text-slate-500" />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}
