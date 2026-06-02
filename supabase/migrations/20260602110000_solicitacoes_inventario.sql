CREATE TABLE IF NOT EXISTS solicitacoes_inventario (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  status text NOT NULL DEFAULT 'pendente',
  tipo_recurso text NOT NULL,
  recurso_id uuid,
  acao text NOT NULL,
  dados_anteriores jsonb,
  dados_propostos jsonb,
  solicitante_id uuid,
  solicitante_nome text,
  revisor_id uuid,
  revisor_nome text,
  parecer text,
  erro_aplicacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  revisado_em timestamptz,
  CONSTRAINT chk_solicitacoes_inventario_status
    CHECK (status IN ('pendente', 'aprovada', 'recusada')),
  CONSTRAINT chk_solicitacoes_inventario_tipo_recurso
    CHECK (tipo_recurso IN (
      'maquinas',
      'notebooks',
      'aparelhos',
      'impressoras',
      'ramais',
      'racks',
      'alocacoes_maquinas',
      'alocacoes_notebooks',
      'alocacoes_aparelhos',
      'alocacoes_ramais',
      'colaboradores'
    )),
  CONSTRAINT chk_solicitacoes_inventario_acao
    CHECK (acao IN ('CREATE', 'UPDATE', 'DELETE', 'ALLOCATE', 'DEALLOCATE', 'CORRECTION'))
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_inventario_status
  ON solicitacoes_inventario (status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_inventario_tipo_recurso
  ON solicitacoes_inventario (tipo_recurso);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_inventario_solicitante
  ON solicitacoes_inventario (solicitante_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_inventario_created_at
  ON solicitacoes_inventario (created_at DESC);
