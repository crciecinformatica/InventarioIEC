CREATE TABLE forum_topicos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo     TEXT NOT NULL,
  conteudo   TEXT NOT NULL,
  autor_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  autor_nome TEXT NOT NULL,
  fixado     BOOLEAN NOT NULL DEFAULT FALSE,
  fechado    BOOLEAN NOT NULL DEFAULT FALSE,
  views      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_comentarios (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topico_id  UUID NOT NULL REFERENCES forum_topicos(id) ON DELETE CASCADE,
  autor_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  autor_nome TEXT NOT NULL,
  conteudo   TEXT NOT NULL,
  editado    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_vinculos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topico_id     UUID REFERENCES forum_topicos(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES forum_comentarios(id) ON DELETE CASCADE,
  tipo_item     TEXT NOT NULL,
  item_id       UUID NOT NULL,
  item_label    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_vinculo_exclusivo CHECK (
    (topico_id IS NULL) <> (comentario_id IS NULL)
  )
);

CREATE TABLE forum_reacoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comentario_id UUID NOT NULL REFERENCES forum_comentarios(id) ON DELETE CASCADE,
  usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comentario_id, usuario_id, tipo)
);

CREATE INDEX idx_forum_topicos_created      ON forum_topicos(created_at DESC);
CREATE INDEX idx_forum_topicos_fixado       ON forum_topicos(fixado) WHERE fixado = TRUE;
CREATE INDEX idx_forum_topicos_autor        ON forum_topicos(autor_id);
CREATE INDEX idx_forum_comentarios_topico   ON forum_comentarios(topico_id);
CREATE INDEX idx_forum_comentarios_autor    ON forum_comentarios(autor_id);
CREATE INDEX idx_forum_vinculos_item        ON forum_vinculos(tipo_item, item_id);
CREATE INDEX idx_forum_reacoes_comentario   ON forum_reacoes(comentario_id);
CREATE INDEX idx_forum_reacoes_usuario      ON forum_reacoes(usuario_id);
