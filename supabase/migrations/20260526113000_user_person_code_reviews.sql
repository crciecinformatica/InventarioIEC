ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS codigo_pessoa TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_usuarios_codigo_pessoa
  ON usuarios (lower(codigo_pessoa))
  WHERE codigo_pessoa IS NOT NULL AND btrim(codigo_pessoa) <> '';

CREATE INDEX IF NOT EXISTS idx_usuarios_codigo_pessoa
  ON usuarios (codigo_pessoa);

ALTER TABLE solicitacoes_usuarios
  DROP CONSTRAINT IF EXISTS chk_solicitacoes_usuarios_status;

ALTER TABLE solicitacoes_usuarios
  ADD CONSTRAINT chk_solicitacoes_usuarios_status
  CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'revisao'));

CREATE INDEX IF NOT EXISTS idx_solicitacoes_usuarios_codigo_pessoa
  ON solicitacoes_usuarios (codigo_pessoa);
