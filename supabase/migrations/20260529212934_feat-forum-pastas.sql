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

-- Add indexes to forum_pastas for better query performance
CREATE INDEX idx_forum_pastas_parent_id ON forum_pastas(parent_id);
CREATE INDEX idx_forum_pastas_criado_por ON forum_pastas(criado_por);
