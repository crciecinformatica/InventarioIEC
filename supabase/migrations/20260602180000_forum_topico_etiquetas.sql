CREATE TABLE IF NOT EXISTS forum_topico_etiquetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topico_id UUID NOT NULL REFERENCES forum_topicos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  etiqueta TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT forum_topico_etiquetas_topico_id_etiqueta_key UNIQUE (topico_id, etiqueta),
  CONSTRAINT chk_forum_topico_etiquetas_etiqueta CHECK (
    etiqueta IN ('comentario', 'tutorial', 'trativa', 'solucao', 'incidente', 'aviso')
  )
);

CREATE INDEX IF NOT EXISTS idx_forum_topico_etiquetas_etiqueta
  ON forum_topico_etiquetas(etiqueta);

CREATE INDEX IF NOT EXISTS idx_forum_topico_etiquetas_topico_id
  ON forum_topico_etiquetas(topico_id);

INSERT INTO forum_topico_etiquetas (topico_id, etiqueta)
SELECT id, 'comentario'
FROM forum_topicos
ON CONFLICT (topico_id, etiqueta) DO NOTHING;
