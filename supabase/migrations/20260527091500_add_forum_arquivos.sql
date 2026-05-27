-- CreateTable forum_arquivos
CREATE TABLE forum_arquivos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topico_id       UUID REFERENCES forum_topicos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  comentario_id   UUID REFERENCES forum_comentarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
  tipo_arquivo    TEXT NOT NULL,
  nome_original   TEXT NOT NULL,
  nome_armazenado TEXT NOT NULL,
  tamanho_bytes   INT NOT NULL,
  url_publica     TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- At least one of topico_id or comentario_id must be NOT NULL
  CONSTRAINT chk_arquivo_vinculo CHECK (
    topico_id IS NULL OR comentario_id IS NULL
  )
);

-- CreateIndex
CREATE INDEX idx_forum_arquivos_topico_id ON forum_arquivos(topico_id);
CREATE INDEX idx_forum_arquivos_comentario_id ON forum_arquivos(comentario_id);
CREATE INDEX idx_forum_arquivos_usuario_id ON forum_arquivos(usuario_id);

