import { parseOptionalDate } from './normalizers'
import { SnowProcessingError } from './types'

export type SnowPlannerPayload = {
  atendente_nome?: unknown
  atendente_codigo_pessoa?: unknown
  planner_task_id?: unknown
  assumido_em?: unknown
  concluido_em?: unknown
  observacao?: unknown
  csc_numero?: unknown
  numero_csc?: unknown
  csc_criado_em?: unknown
  criado_em_csc?: unknown
}

function requiredText(value: unknown, field: string) {
  const text = String(value ?? '').trim()
  if (!text) throw new SnowProcessingError(`Campo obrigatório: ${field}`, 400)
  return text
}

function optionalText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

function requiredDate(value: unknown, field: string) {
  const date = parseOptionalDate(value)
  if (!date) throw new SnowProcessingError(`Campo inválido ou obrigatório: ${field}`, 400)
  return date
}

export function parseAssumirPayload(payload: SnowPlannerPayload) {
  return {
    atendenteNome: requiredText(payload.atendente_nome, 'atendente_nome'),
    atendenteCodigoPessoa: requiredText(payload.atendente_codigo_pessoa, 'atendente_codigo_pessoa'),
    plannerTaskId: optionalText(payload.planner_task_id),
    assumidoEm: parseOptionalDate(payload.assumido_em),
  }
}

export function parseConcluirPayload(payload: SnowPlannerPayload) {
  return {
    atendenteNome: optionalText(payload.atendente_nome),
    atendenteCodigoPessoa: optionalText(payload.atendente_codigo_pessoa),
    plannerTaskId: optionalText(payload.planner_task_id),
    concluidoEm: parseOptionalDate(payload.concluido_em),
    observacao: optionalText(payload.observacao),
  }
}

export function parseCscPayload(payload: SnowPlannerPayload) {
  return {
    cscNumero: requiredText(payload.csc_numero ?? payload.numero_csc, 'csc_numero'),
    cscCriadoEm: requiredDate(payload.csc_criado_em ?? payload.criado_em_csc, 'csc_criado_em'),
  }
}
