CREATE TABLE IF NOT EXISTS solicitacoes_usuarios (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome             TEXT NOT NULL,
  codigo_pessoa    TEXT NOT NULL,
  email            TEXT NOT NULL,
  senha_hash       TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pendente',
  observacao       TEXT,
  usuario_id       UUID,
  aprovado_por_id  UUID,
  aprovado_por     TEXT,
  aprovado_em      TIMESTAMPTZ,
  rejeitado_por_id UUID,
  rejeitado_por    TEXT,
  rejeitado_em     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_solicitacoes_usuarios_status CHECK (status IN ('pendente', 'aprovada', 'rejeitada'))
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_usuarios_status
  ON solicitacoes_usuarios(status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_usuarios_email
  ON solicitacoes_usuarios(email);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_solicitacoes_usuarios_email_pendente
  ON solicitacoes_usuarios(lower(email))
  WHERE status = 'pendente';

ALTER TABLE forum_comentarios
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'permanente',
  ADD COLUMN IF NOT EXISTS expira_em TIMESTAMPTZ;

ALTER TABLE forum_comentarios
  ADD CONSTRAINT chk_forum_comentarios_tipo
  CHECK (tipo IN ('permanente', 'temporario'));

CREATE INDEX IF NOT EXISTS idx_forum_vinculos_item
  ON forum_vinculos(tipo_item, item_id);

CREATE INDEX IF NOT EXISTS idx_forum_comentarios_expira_em
  ON forum_comentarios(expira_em);
