ALTER TABLE solicitacoes_snow_itens
  ADD COLUMN IF NOT EXISTS planner_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS planner_task_id text,
  ADD COLUMN IF NOT EXISTS atendente_nome text,
  ADD COLUMN IF NOT EXISTS atendente_codigo_pessoa text,
  ADD COLUMN IF NOT EXISTS assumido_em timestamptz,
  ADD COLUMN IF NOT EXISTS concluido_em timestamptz,
  ADD COLUMN IF NOT EXISTS conclusao_observacao text,
  ADD COLUMN IF NOT EXISTS planner_atualizado_em timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_solicitacoes_snow_itens_planner_status'
  ) THEN
    ALTER TABLE solicitacoes_snow_itens
      ADD CONSTRAINT chk_solicitacoes_snow_itens_planner_status
      CHECK (planner_status IN ('pendente', 'assumido', 'concluido'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_itens_planner_status
  ON solicitacoes_snow_itens (planner_status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_itens_atendente_codigo
  ON solicitacoes_snow_itens (atendente_codigo_pessoa);
