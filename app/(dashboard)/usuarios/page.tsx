'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { AnimatedDialogFrame } from '@/components/layout/motion-primitives'
import { UsuarioModal } from '@/components/modals/usuario-modal'
import { readInspectHistory, updateInspectHistory, writeInspectHistory } from '@/lib/navigation-context'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Usuario {
  id: string
  nome: string
  codigo_pessoa?: string | null
  email: string
  perfil: string
  ativo: boolean
  created_at: string | null
  total_acoes?: number
  forum_acoes?: number
}

interface SolicitacaoUsuario {
  id: string
  nome: string
  codigo_pessoa: string
  email: string
  status: string
  observacao: string | null
  created_at: string | null
}

const PERFIL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  dev: 'Desenvolvimento',
  viewer: 'Visualizador',
}

export default function UsuariosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoUsuario[]>([])
  const [requestsReady, setRequestsReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Usuario | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<SolicitacaoUsuario | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [navigatingUserId, setNavigatingUserId] = useState<string | null>(null)

  const perfil = (session?.user as any)?.perfil
  const canManage = perfil === 'admin' || perfil === 'dev'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const usersRes = await fetch('/api/admin/usuarios')
      if (usersRes.status === 403) {
        router.push('/')
        return
      }
      if (!usersRes.ok) throw new Error('Erro ao carregar usuários.')
      const usersJson = await usersRes.json()
      setUsuarios(Array.isArray(usersJson) ? usersJson : [])

      const requestsRes = await fetch('/api/admin/usuarios/solicitacoes')
      if (requestsRes.status === 403) {
        router.push('/')
        return
      }
      if (!requestsRes.ok) {
        setSolicitacoes([])
        setRequestsReady(true)
        return
      }
      const requestsJson = await requestsRes.json()
      setSolicitacoes(Array.isArray(requestsJson) ? requestsJson : [])
      setRequestsReady(true)
    } catch {
      toast.error('Erro ao carregar usuários.')
      setRequestsReady(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  async function processarSolicitacao(id: string, acao: 'aprovar' | 'rejeitar') {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/usuarios/solicitacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Erro')
      toast.success(acao === 'aprovar' ? 'Solicitação aprovada.' : 'Solicitação rejeitada.')
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar solicitação.')
    } finally {
      setProcessingId(null)
    }
  }

  function verAcoes(usuario: Usuario) {
    if ((usuario.total_acoes ?? 0) <= 0) {
      toast.info('Este usuário ainda não possui ações registradas na auditoria.')
      return
    }

    const params = new URLSearchParams({
      usuario_id: usuario.id,
      usuario_label: usuario.nome || usuario.email,
      edicoes: '1',
    })
    const targetHref = `/movimentacoes?${params.toString()}`
    setNavigatingUserId(usuario.id)

    const history = readInspectHistory(window.sessionStorage)
    writeInspectHistory(window.sessionStorage, updateInspectHistory(history, {
      path: '/usuarios',
      inspectId: usuario.id,
      type: 'usuario',
      label: 'Usuário',
      title: usuario.nome || usuario.email,
      subtitle: usuario.email,
      href: '/usuarios',
      timestamp: Date.now(),
    }))

    window.setTimeout(() => router.push(targetHref), 180)
  }

  if (!canManage) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Acesso Restrito</h2>
        <p className="text-sm text-slate-500">Apenas administradores e desenvolvimento podem gerenciar usuários.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto space-y-6">
      <PageHeader title="Usuários do Sistema" total={usuarios.length}>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          Novo usuário
        </button>
      </PageHeader>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Solicitações de acesso pendentes
          </h2>
          <span className="text-xs text-slate-400">{solicitacoes.length} pendente(s)</span>
        </div>
        <div className="min-h-[92px]">
          {!requestsReady ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[92px] rounded-lg border border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="space-y-3 p-3">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : solicitacoes.length === 0 ? (
            <motion.div
              key="empty-requests"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-400"
            >
              Nenhuma solicitação de acesso aguardando aprovação.
            </motion.div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {solicitacoes.map((solicitacao) => (
                <button
                  key={solicitacao.id}
                  type="button"
                  onClick={() => setSelectedRequest(solicitacao)}
                  className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-950 dark:bg-blue-950/20 dark:hover:border-blue-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{solicitacao.nome}</h3>
                      <p className="truncate text-xs text-slate-500">{solicitacao.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${solicitacao.status === 'revisao' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                      {solicitacao.status === 'revisao' ? 'revisão' : 'novo'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Código {solicitacao.codigo_pessoa} · {formatDate(solicitacao.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Usuários cadastrados
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {usuarios.map(usuario => {
              const totalAcoes = usuario.total_acoes ?? 0
              const hasAuditActions = totalAcoes > 0
              return (
              <motion.article
                key={usuario.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
              >
                <button type="button" onClick={() => setSelected(usuario)} className="w-full text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {initials(usuario.nome)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900 dark:text-white">{usuario.nome}</h3>
                      <p className="truncate text-sm text-slate-500">{usuario.email}</p>
                      <p className="mt-1 text-xs text-slate-400">Cadastrado em {formatDate(usuario.created_at)}</p>
                    </div>
                  </div>
                </button>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {PERFIL_LABELS[usuario.perfil] ?? usuario.perfil}
                  </span>
                  <span className={`rounded-md px-2 py-1 ${usuario.ativo ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{usuario.total_acoes ?? 0}</p>
                    <p className="text-xs text-slate-400">ações auditadas</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{usuario.forum_acoes ?? 0}</p>
                    <p className="text-xs text-slate-400">ações no fórum</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(usuario)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => verAcoes(usuario)}
                    disabled={!hasAuditActions || navigatingUserId === usuario.id}
                    title={hasAuditActions ? 'Abrir auditoria filtrada por este usuário' : 'Sem ações registradas na auditoria'}
                    className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-70 dark:bg-white dark:text-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  >
                    {navigatingUserId === usuario.id ? 'Abrindo...' : hasAuditActions ? 'Ver ações' : 'Sem ações'}
                  </button>
                </div>
              </motion.article>
              )
            })}
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence initial={false}>
        {navigatingUserId && (
          <motion.div
            key="audit-transition"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-4 text-center shadow-2xl"
            >
              <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
              <p className="text-sm font-semibold text-white">Abrindo auditoria</p>
              <p className="mt-1 text-xs text-slate-400">Aplicando filtros do usuário selecionado...</p>
            </motion.div>
          </motion.div>
        )}
        {selected && (
          <UsuarioModal
            key={`usuario-${selected.id}`}
            usuario={selected}
            onClose={() => setSelected(null)}
            onRefresh={fetchData}
          />
        )}

        {showNew && (
          <UsuarioModal
            key="novo-usuario"
            onClose={() => setShowNew(false)}
            onRefresh={fetchData}
          />
        )}
        {selectedRequest && (
          <AnimatedDialogFrame
            key={`solicitacao-${selectedRequest.id}`}
            onClose={() => setSelectedRequest(null)}
            className="max-w-lg rounded-xl border border-slate-100 p-0 dark:border-slate-800"
          >
            <div className="border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Solicitação {selectedRequest.status === 'revisao' ? 'em revisão' : 'pendente'}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedRequest.nome}</h2>
                  <p className="text-sm text-slate-500">{selectedRequest.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile label="Código de pessoa" value={selectedRequest.codigo_pessoa} />
                <InfoTile label="Solicitado em" value={formatDate(selectedRequest.created_at)} />
              </div>
              {selectedRequest.observacao && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  {selectedRequest.observacao}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  disabled={processingId === selectedRequest.id}
                  onClick={() => processarSolicitacao(selectedRequest.id, 'rejeitar').then(() => setSelectedRequest(null))}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Rejeitar
                </button>
                <button
                  disabled={processingId === selectedRequest.id}
                  onClick={() => processarSolicitacao(selectedRequest.id, 'aprovar').then(() => setSelectedRequest(null))}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  Aprovar
                </button>
              </div>
            </div>
          </AnimatedDialogFrame>
        )}
      </AnimatePresence>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value || '—'}</p>
    </div>
  )
}

function initials(nome: string) {
  return nome
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
