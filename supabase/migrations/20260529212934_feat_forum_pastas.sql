-- Create forum_pastas table
CREATE TABLE forum_pastas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  parent_id uuid REFERENCES forum_pastas(id) ON DELETE CASCADE,
  criado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  cor text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for forum_pastas
CREATE INDEX idx_forum_pastas_parent_id ON forum_pastas(parent_id);
CREATE INDEX idx_forum_pastas_criado_por ON forum_pastas(criado_por);

-- Add pasta_id column to forum_arquivos
ALTER TABLE forum_arquivos
ADD COLUMN pasta_id uuid;

-- Add foreign key constraint for pasta_id
ALTER TABLE forum_arquivos
ADD CONSTRAINT fk_forum_arquivos_pasta_id
FOREIGN KEY (pasta_id)
REFERENCES forum_pastas(id)
ON DELETE SET NULL;

-- Add index for pasta_id
CREATE INDEX idx_forum_arquivos_pasta_id ON forum_arquivos(pasta_id);
