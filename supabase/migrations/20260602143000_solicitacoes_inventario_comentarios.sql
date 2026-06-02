ALTER TABLE solicitacoes_inventario
  ADD COLUMN IF NOT EXISTS comentarios jsonb DEFAULT '[]'::jsonb;

UPDATE solicitacoes_inventario
SET comentarios = '[]'::jsonb
WHERE comentarios IS NULL;
