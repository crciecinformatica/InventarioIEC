ALTER TABLE public.solicitacoes_snow_itens
  ADD COLUMN IF NOT EXISTS csc_numero TEXT,
  ADD COLUMN IF NOT EXISTS csc_criado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS csc_atualizado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_snow_itens_csc_numero
  ON public.solicitacoes_snow_itens (csc_numero);
