CREATE TABLE IF NOT EXISTS solicitacoes_snow (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_arquivo text NOT NULL,
  tipo_arquivo text NOT NULL,
  assunto_email text,
  origem_email text,
  recebido_em timestamptz,
  total_recebido integer NOT NULL DEFAULT 0,
  total_atendidas integer NOT NULL DEFAULT 0,
  total_nao_atendidas integer NOT NULL DEFAULT 0,
  total_quarentena integer NOT NULL DEFAULT 0,
  total_inconsistentes integer NOT NULL DEFAULT 0,
  status_processamento text NOT NULL,
  erro_processamento text,
  criado_em timestamptz DEFAULT now(),
  CONSTRAINT chk_solicitacoes_snow_tipo_arquivo
    CHECK (tipo_arquivo IN (
      'ativos_nao_inventariados',
      'computadores_fora_organizacao',
      'computadores_a_serem_arquivados'
    )),
  CONSTRAINT chk_solicitacoes_snow_status_processamento
    CHECK (status_processamento IN ('processado', 'erro_processamento'))
);

CREATE TABLE IF NOT EXISTS solicitacoes_snow_itens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_snow_id uuid NOT NULL REFERENCES solicitacoes_snow(id) ON DELETE CASCADE,
  ip text,
  hostname text,
  tipo_arquivo text NOT NULL,
  status text NOT NULL,
  motivo text,
  maquina_id uuid REFERENCES maquinas(id),
  colaborador_alocado text,
  setor_alocado text,
  localidade_alocada text,
  ultima_revisao date,
  data_ultima_solicitacao timestamptz,
  bloqueado_ate timestamptz,
  criado_em timestamptz DEFAULT now(),
  CONSTRAINT chk_solicitacoes_snow_itens_tipo_arquivo
    CHECK (tipo_arquivo IN (
      'ativos_nao_inventariados',
      'computadores_fora_organizacao',
      'computadores_a_serem_arquivados'
    )),
  CONSTRAINT chk_solicitacoes_snow_itens_status
    CHECK (status IN (
      'atendida',
      'nao_atendida',
      'em_quarentena',
      'inconsistente',
      'erro_processamento'
    ))
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_tipo_arquivo
  ON solicitacoes_snow (tipo_arquivo);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_criado_em
  ON solicitacoes_snow (criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_itens_status
  ON solicitacoes_snow_itens (status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_itens_maquina_id
  ON solicitacoes_snow_itens (maquina_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_itens_ip
  ON solicitacoes_snow_itens (ip);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_itens_hostname
  ON solicitacoes_snow_itens (hostname);
