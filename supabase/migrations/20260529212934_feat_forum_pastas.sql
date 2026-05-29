-- Create forum_pastas table
CREATE TABLE forum_pastas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  parent_id uuid,
  criado_por uuid,
  cor text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign keys to forum_pastas
ALTER TABLE forum_pastas
ADD CONSTRAINT forum_pastas_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES forum_pastas(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE forum_pastas
ADD CONSTRAINT forum_pastas_criado_por_fkey
FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for forum_pastas
CREATE INDEX idx_forum_pastas_parent_id ON forum_pastas(parent_id);
CREATE INDEX idx_forum_pastas_criado_por ON forum_pastas(criado_por);

-- Add pasta_id column to forum_arquivos
ALTER TABLE forum_arquivos
ADD COLUMN pasta_id uuid;

-- Add foreign key constraint for pasta_id
ALTER TABLE forum_arquivos
ADD CONSTRAINT forum_arquivos_pasta_id_fkey
FOREIGN KEY (pasta_id) REFERENCES forum_pastas(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for pasta_id
CREATE INDEX idx_forum_arquivos_pasta_id ON forum_arquivos(pasta_id);
