CREATE TABLE IF NOT EXISTS forum_topico_avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topico_id UUID NOT NULL REFERENCES forum_topicos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  tipo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT forum_topico_avaliacoes_topico_id_usuario_id_key UNIQUE (topico_id, usuario_id),
  CONSTRAINT chk_forum_topico_avaliacoes_tipo CHECK (tipo IN ('aprovado', 'reprovado'))
);

CREATE INDEX IF NOT EXISTS idx_forum_topico_avaliacoes_topico_tipo
  ON forum_topico_avaliacoes(topico_id, tipo);
