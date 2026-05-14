-- Remove redundant textual sector columns after backfilling setor_id from setores.
-- The source of truth for the current sector is now the setor_id foreign key.

UPDATE colaboradores c
SET setor_id = s.id
FROM setores s
WHERE c.setor_id IS NULL
  AND c.setor IS NOT NULL
  AND lower(trim(c.setor)) = lower(trim(s.nome));

UPDATE maquinas m
SET setor_id = s.id
FROM setores s
WHERE m.setor_id IS NULL
  AND m.setor IS NOT NULL
  AND lower(trim(m.setor)) = lower(trim(s.nome));

UPDATE notebooks n
SET setor_id = s.id
FROM setores s
WHERE n.setor_id IS NULL
  AND n.setor IS NOT NULL
  AND lower(trim(n.setor)) = lower(trim(s.nome));

UPDATE aparelhos a
SET setor_id = s.id
FROM setores s
WHERE a.setor_id IS NULL
  AND a.setor IS NOT NULL
  AND lower(trim(a.setor)) = lower(trim(s.nome));

UPDATE ramais r
SET setor_id = s.id
FROM setores s
WHERE r.setor_id IS NULL
  AND r.nome_setor IS NOT NULL
  AND lower(trim(r.nome_setor)) = lower(trim(s.nome));

DROP INDEX IF EXISTS idx_colaboradores_setor;
DROP INDEX IF EXISTS idx_maquinas_setor;

ALTER TABLE colaboradores DROP COLUMN IF EXISTS setor;
ALTER TABLE maquinas DROP COLUMN IF EXISTS setor;
ALTER TABLE notebooks DROP COLUMN IF EXISTS setor;
ALTER TABLE aparelhos DROP COLUMN IF EXISTS setor;
ALTER TABLE ramais DROP COLUMN IF EXISTS nome_setor;
