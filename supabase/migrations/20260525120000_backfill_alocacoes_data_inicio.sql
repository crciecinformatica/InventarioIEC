UPDATE "alocacoes_maquinas"
SET "data_inicio" = DATE '2026-01-01'
WHERE "data_inicio" IS NULL
  AND "data_fim" IS NULL;

UPDATE "alocacoes_notebooks"
SET "data_inicio" = DATE '2026-01-01'
WHERE "data_inicio" IS NULL
  AND "data_fim" IS NULL;

UPDATE "alocacoes_aparelhos"
SET "data_inicio" = DATE '2026-01-01'
WHERE "data_inicio" IS NULL
  AND "data_fim" IS NULL;

UPDATE "alocacoes_ramais"
SET "data_inicio" = DATE '2026-01-01'
WHERE "data_inicio" IS NULL
  AND "data_fim" IS NULL;
