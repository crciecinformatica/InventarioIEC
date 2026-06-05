import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { descricaoDiff, registrarAuditoria, type AuditAction } from '@/lib/audit'
import { withoutLegacyVirtualFields } from '@/lib/payload'
import { deleteArquivo } from '@/lib/supabase-storage'

export const SOLICITACAO_INVENTARIO_STATUS = ['pendente', 'aprovada', 'recusada'] as const
export const SOLICITACAO_INVENTARIO_ACOES = ['CREATE', 'UPDATE', 'DELETE', 'ALLOCATE', 'DEALLOCATE', 'CORRECTION', 'UPLOAD'] as const

export type SolicitacaoInventarioAcao = typeof SOLICITACAO_INVENTARIO_ACOES[number]

type ResourceConfig = {
  delegate: string
  label: string
  alocacao?: boolean
}

type ResourceDelegate = {
  findUnique?: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>
  create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Record<string, unknown>>
  delete: (args: { where: { id: string } }) => Promise<Record<string, unknown>>
}

type SolicitacaoInventarioAplicavel = {
  id: string
  tipo_recurso: string
  recurso_id: string | null
  acao: string
  dados_anteriores: Record<string, unknown> | null
  dados_propostos: Record<string, unknown> | null
}

type SolicitacaoInventarioResponse = SolicitacaoInventarioAplicavel & {
  [key: string]: unknown
}

export const SOLICITACAO_INVENTARIO_RECURSOS: Record<string, ResourceConfig> = {
  maquinas: { delegate: 'maquinas', label: 'Máquinas' },
  notebooks: { delegate: 'notebooks', label: 'Notebooks' },
  aparelhos: { delegate: 'aparelhos', label: 'Aparelhos' },
  impressoras: { delegate: 'impressoras', label: 'Impressoras' },
  ramais: { delegate: 'ramais', label: 'Ramais' },
  racks: { delegate: 'racks', label: 'Racks' },
  colaboradores: { delegate: 'colaboradores', label: 'Colaboradores' },
  alocacoes_maquinas: { delegate: 'alocacoes_maquinas', label: 'Alocações — Máquinas', alocacao: true },
  alocacoes_notebooks: { delegate: 'alocacoes_notebooks', label: 'Alocações — Notebooks', alocacao: true },
  alocacoes_aparelhos: { delegate: 'alocacoes_aparelhos', label: 'Alocações — Aparelhos', alocacao: true },
  alocacoes_ramais: { delegate: 'alocacoes_ramais', label: 'Alocações — Ramais', alocacao: true },
  forum_arquivos: { delegate: 'forum_arquivos', label: 'Documentos do Fórum' },
}

export function normalizarTipoRecurso(tipoRecurso: string) {
  if (tipoRecurso === 'alocacoes') return null
  return SOLICITACAO_INVENTARIO_RECURSOS[tipoRecurso] ? tipoRecurso : null
}

export function getResourceDelegate(tipoRecurso: string) {
  const recurso = SOLICITACAO_INVENTARIO_RECURSOS[tipoRecurso]
  if (!recurso) return null
  return (prisma as unknown as Record<string, ResourceDelegate>)[recurso.delegate] ?? null
}

export function cleanInventarioPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {}
  const clean = { ...withoutLegacyVirtualFields(payload as Record<string, unknown>) }
  for (const key of [
    'id',
    'created_at',
    'updated_at',
    'setor_nome',
    'localidade_nome',
    'colaborador_nome',
    'maquina_label',
    'notebook_label',
    'aparelho_label',
    'impressora_label',
    'ramal_label',
    'rack_label',
    'recurso_label',
    'setor_rel',
    'localidade_rel',
    'colaborador',
    'maquina',
    'notebook',
    'aparelho',
    'impressora',
    'ramal',
    'rack',
    'alocacoes',
    'alocacao_ativa',
    'alocacoes_ativas',
    '_count',
    'pasta_nome',
    'enviado_por_nome',
  ]) {
    delete clean[key]
  }
  return clean
}

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function findLabel(delegateName: string, id: unknown, labelKeys: string[]) {
  if (!isUuid(id)) return null
  const delegate = (prisma as unknown as Record<string, { findUnique?: (args: unknown) => Promise<Record<string, unknown> | null> }>)[delegateName]
  if (!delegate?.findUnique) return null

  try {
    const record = await delegate.findUnique({ where: { id } })
    if (!record) return null
    for (const key of labelKeys) {
      const value = record[key]
      if (value !== null && value !== undefined && String(value).trim()) return String(value)
    }
    return String(record.id ?? id)
  } catch {
    return null
  }
}

export async function enriquecerPayloadInventario(tipoRecurso: string, payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload

  const enriched = { ...(payload as Record<string, unknown>) }
  const additions = await Promise.all([
    findLabel('setores', enriched.setor_id, ['nome']).then(label => { if (label) enriched.setor_nome = label }),
    findLabel('localidades', enriched.localidade_id, ['nome']).then(label => { if (label) enriched.localidade_nome = label }),
    findLabel('colaboradores', enriched.colaborador_id, ['nome', 'codigo']).then(label => { if (label) enriched.colaborador_nome = label }),
    findLabel('maquinas', enriched.maquina_id, ['endereco_ip', 'nome_host', 'identificador', 'modelo']).then(label => { if (label) enriched.maquina_label = label }),
    findLabel('notebooks', enriched.notebook_id, ['numero_patrimonio', 'modelo', 'fabricante']).then(label => { if (label) enriched.notebook_label = label }),
    findLabel('aparelhos', enriched.aparelho_id, ['modelo', 'endereco_ip', 'endereco_mac']).then(label => { if (label) enriched.aparelho_label = label }),
    findLabel('impressoras', enriched.impressora_id, ['endereco_ip', 'nome_host', 'modelo', 'numero_serie']).then(label => { if (label) enriched.impressora_label = label }),
    findLabel('ramais', enriched.ramal_id, ['numero_ramal', 'prefixo_telefonico']).then(label => { if (label) enriched.ramal_label = label }),
    findLabel('racks', enriched.rack_id, ['nome_switch', 'localizacao', 'numero_patrimonio']).then(label => { if (label) enriched.rack_label = label }),
  ])
  await Promise.all(additions)

  const resourceConfig = SOLICITACAO_INVENTARIO_RECURSOS[tipoRecurso]
  const resourceLabel = await findLabel(resourceConfig?.delegate ?? '', enriched.id, [
    'endereco_ip',
    'nome_host',
    'nome',
    'numero_ramal',
    'nome_switch',
    'numero_patrimonio',
    'modelo',
    'identificador',
  ])
  if (resourceLabel) enriched.recurso_label = resourceLabel

  return enriched
}

export async function buscarSnapshotInventario(tipoRecurso: string, recursoId?: string | null) {
  if (!recursoId) return null
  const delegate = getResourceDelegate(tipoRecurso)
  if (!delegate?.findUnique) return null
  const snapshot = await delegate.findUnique({ where: { id: recursoId } })
  return enriquecerPayloadInventario(tipoRecurso, snapshot)
}

export function sanitizeSolicitacaoInventarioResponse<T extends SolicitacaoInventarioResponse>(solicitacao: T): T {
  if (solicitacao.tipo_recurso !== 'forum_arquivos') return solicitacao
  const dadosPropostos = solicitacao.dados_propostos
  if (typeof dadosPropostos?.url_publica !== 'string') return solicitacao
  if (!dadosPropostos.url_publica.startsWith('data:')) return solicitacao

  return {
    ...solicitacao,
    dados_propostos: {
      ...dadosPropostos,
      url_publica: '[arquivo anexado ao pedido]',
    },
  }
}

export function sanitizeSolicitacoesInventarioResponse<T extends SolicitacaoInventarioResponse>(solicitacoes: T[]) {
  return solicitacoes.map(sanitizeSolicitacaoInventarioResponse)
}

export async function aplicarSolicitacaoInventario(
  solicitacao: SolicitacaoInventarioAplicavel,
  reviewer: { usuario_id: string | null; usuario_nome: string | null },
) {
  const tipoRecurso = normalizarTipoRecurso(solicitacao.tipo_recurso)
  if (!tipoRecurso) throw new Error('Tipo de recurso inválido')

  const recurso = SOLICITACAO_INVENTARIO_RECURSOS[tipoRecurso]
  const delegate = getResourceDelegate(tipoRecurso)
  if (!delegate) throw new Error('Recurso não suportado')

  const acao = solicitacao.acao as SolicitacaoInventarioAcao
  const dadosPropostos = cleanInventarioPayload(solicitacao.dados_propostos)
  const recursoId = solicitacao.recurso_id
  const anterior = recursoId ? await buscarSnapshotInventario(tipoRecurso, recursoId) : null
  let resultado: Record<string, unknown> | null = null
  let auditAction: AuditAction = acao as AuditAction

  if (tipoRecurso === 'forum_arquivos' && acao === 'UPLOAD') {
    resultado = await delegate.create({ data: dadosPropostos })
    auditAction = 'CREATE'
  } else if (acao === 'CREATE' || acao === 'ALLOCATE') {
    resultado = await delegate.create({ data: dadosPropostos })
    auditAction = recurso.alocacao || acao === 'ALLOCATE' ? 'ALOCAR' : 'CREATE'
  } else if (acao === 'UPDATE' || acao === 'CORRECTION') {
    if (!recursoId) throw new Error('recurso_id é obrigatório para edição')
    resultado = await delegate.update({ where: { id: recursoId }, data: dadosPropostos })
    auditAction = recurso.alocacao ? 'EDITAR_ALOCACAO' : 'UPDATE'
  } else if (acao === 'DELETE') {
    if (!recursoId) throw new Error('recurso_id é obrigatório para exclusão')
    resultado = await delegate.delete({ where: { id: recursoId } })
    auditAction = 'DELETE'
  } else if (acao === 'DEALLOCATE') {
    if (!recursoId) throw new Error('recurso_id é obrigatório para desalocação')
    resultado = await delegate.update({
      where: { id: recursoId },
      data: { ativo: false, data_fim: new Date() },
    })
    auditAction = 'DESALOCAR'
  } else {
    throw new Error('Ação inválida')
  }

  await registrarAuditoria({
    tabela: tipoRecurso,
    registro_id: String(resultado?.id ?? recursoId ?? solicitacao.id),
    acao: auditAction,
    descricao: tipoRecurso === 'forum_arquivos' && acao === 'UPLOAD'
      ? `Upload aprovado: ${String(dadosPropostos.nome_original ?? 'arquivo')}`
      : auditAction === 'UPDATE' || auditAction === 'EDITAR_ALOCACAO'
        ? descricaoDiff((anterior ?? {}) as Record<string, unknown>, dadosPropostos)
        : `Solicitação de inventário aprovada: ${recurso.label}`,
    dados_anteriores: (anterior ?? solicitacao.dados_anteriores ?? null) as Prisma.JsonObject | null,
    dados_novos: (resultado ?? dadosPropostos ?? null) as Prisma.JsonObject | null,
    usuario_id: reviewer.usuario_id,
    usuario_nome: reviewer.usuario_nome,
  })

  return resultado
}

export async function descartarUploadPendenteSolicitacao(solicitacao: SolicitacaoInventarioAplicavel) {
  if (solicitacao.tipo_recurso !== 'forum_arquivos' || solicitacao.acao !== 'UPLOAD') return

  const storagePath = solicitacao.dados_propostos?.nome_armazenado
  const publicUrl = solicitacao.dados_propostos?.url_publica
  if (typeof storagePath !== 'string' || !storagePath.trim()) return
  if (storagePath.startsWith('inline-upload/') || (typeof publicUrl === 'string' && publicUrl.startsWith('data:'))) return

  try {
    await deleteArquivo(storagePath)
  } catch (error) {
    console.error('[solicitacoes-inventario] erro ao remover upload pendente', error)
  }
}
