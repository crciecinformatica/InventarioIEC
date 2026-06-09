export const TIPOS_RELATORIO_SNOW = [
  'ativos_nao_inventariados',
  'computadores_fora_organizacao',
  'computadores_a_serem_arquivados',
] as const

export const STATUS_ITEM_SNOW = [
  'atendida',
  'nao_atendida',
  'em_quarentena',
  'inconsistente',
  'erro_processamento',
] as const

export type TipoRelatorioSnow = typeof TIPOS_RELATORIO_SNOW[number]
export type StatusItemSnow = typeof STATUS_ITEM_SNOW[number]
export type StatusProcessamentoSnow = 'processado' | 'erro_processamento'

export type SnowMetadata = {
  nomeArquivo: string
  assuntoEmail?: string | null
  origemEmail?: string | null
  recebidoEm?: Date | null
}

export type SnowParsedItem = {
  ip: string | null
  hostname: string | null
  raw: Record<string, unknown>
}

export type SnowMachineMatch = {
  id: string
  nome_host: string | null
  endereco_ip: string | null
  data_revisao: Date | string | null
  setor_rel?: { nome: string | null } | null
  localidade_rel?: { nome: string | null } | null
  alocacoes?: Array<{
    colaborador?: {
      nome: string | null
      setor_rel?: { nome: string | null } | null
    } | null
  }>
}

export type SnowProcessedItem = {
  id?: string
  solicitacao_snow_id?: string
  ip: string | null
  hostname: string | null
  tipo_arquivo: TipoRelatorioSnow
  status: StatusItemSnow
  motivo: string
  maquina_id: string | null
  colaborador_alocado: string | null
  setor_alocado: string | null
  localidade_alocada: string | null
  ultima_revisao: Date | string | null
  data_ultima_solicitacao: Date | null
  bloqueado_ate: Date | null
  planner_status?: 'pendente' | 'assumido' | 'concluido'
  planner_task_id?: string | null
  atendente_nome?: string | null
  atendente_codigo_pessoa?: string | null
  assumido_em?: Date | string | null
  concluido_em?: Date | string | null
  conclusao_observacao?: string | null
  planner_atualizado_em?: Date | string | null
}

export type SnowProcessResult = {
  arquivo: string
  tipo_relatorio: TipoRelatorioSnow
  descricao: string
  resumo: {
    total_recebido: number
    atendidas: number
    nao_atendidas: number
    em_quarentena: number
    inconsistentes: number
  }
  sections: Array<{
    key: 'atendidas' | 'inconsistentes'
    titulo: string
    descricao: string
    total: number
    itens: SnowProcessedItem[]
  }>
}

export class SnowProcessingError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'SnowProcessingError'
    this.status = status
  }
}
