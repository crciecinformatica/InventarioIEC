-- Setores are a global catalog. Localidade belongs to assets/colaboradores,
-- so sectors must not be scoped to a single localidade.

ALTER TABLE "setores" DROP CONSTRAINT IF EXISTS "setores_localidade_id_fkey";
DROP INDEX IF EXISTS "idx_setores_localidade_id";
ALTER TABLE "setores" DROP COLUMN IF EXISTS "localidade_id";
