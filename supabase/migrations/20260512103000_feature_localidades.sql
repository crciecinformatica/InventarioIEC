CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "localidades" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "localidades_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "localidades_nome_key" ON "localidades"("nome");
CREATE INDEX IF NOT EXISTS "idx_localidades_ativo" ON "localidades"("ativo");
CREATE INDEX IF NOT EXISTS "idx_localidades_nome" ON "localidades"("nome");

INSERT INTO "localidades" ("nome", "ativo")
VALUES
    ('IEC - São Gabriel', true),
    ('IEC - Lourdes', true),
    ('IEC - Coreu', true),
    ('IEC - Betim', true),
    ('IEC - Barreiro', true),
    ('IEC - Contagem', true)
ON CONFLICT ("nome") DO UPDATE SET "ativo" = EXCLUDED."ativo";

ALTER TABLE "colaboradores" ADD COLUMN IF NOT EXISTS "localidade_id" UUID;
ALTER TABLE "maquinas" ADD COLUMN IF NOT EXISTS "localidade_id" UUID;
ALTER TABLE "notebooks" ADD COLUMN IF NOT EXISTS "localidade_id" UUID;
ALTER TABLE "aparelhos" ADD COLUMN IF NOT EXISTS "localidade_id" UUID;
ALTER TABLE "impressoras" ADD COLUMN IF NOT EXISTS "localidade_id" UUID;
ALTER TABLE "ramais" ADD COLUMN IF NOT EXISTS "localidade_id" UUID;
ALTER TABLE "racks" ADD COLUMN IF NOT EXISTS "localidade_id" UUID;

CREATE INDEX IF NOT EXISTS "idx_colaboradores_localidade_id" ON "colaboradores"("localidade_id");
CREATE INDEX IF NOT EXISTS "idx_maquinas_localidade_id" ON "maquinas"("localidade_id");
CREATE INDEX IF NOT EXISTS "idx_notebooks_localidade_id" ON "notebooks"("localidade_id");
CREATE INDEX IF NOT EXISTS "idx_aparelhos_localidade_id" ON "aparelhos"("localidade_id");
CREATE INDEX IF NOT EXISTS "idx_impressoras_localidade_id" ON "impressoras"("localidade_id");
CREATE INDEX IF NOT EXISTS "idx_ramais_localidade_id" ON "ramais"("localidade_id");
CREATE INDEX IF NOT EXISTS "idx_racks_localidade_id" ON "racks"("localidade_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'colaboradores_localidade_id_fkey') THEN
        ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_localidade_id_fkey" FOREIGN KEY ("localidade_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maquinas_localidade_id_fkey') THEN
        ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_localidade_id_fkey" FOREIGN KEY ("localidade_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notebooks_localidade_id_fkey') THEN
        ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_localidade_id_fkey" FOREIGN KEY ("localidade_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'aparelhos_localidade_id_fkey') THEN
        ALTER TABLE "aparelhos" ADD CONSTRAINT "aparelhos_localidade_id_fkey" FOREIGN KEY ("localidade_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'impressoras_localidade_id_fkey') THEN
        ALTER TABLE "impressoras" ADD CONSTRAINT "impressoras_localidade_id_fkey" FOREIGN KEY ("localidade_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ramais_localidade_id_fkey') THEN
        ALTER TABLE "ramais" ADD CONSTRAINT "ramais_localidade_id_fkey" FOREIGN KEY ("localidade_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'racks_localidade_id_fkey') THEN
        ALTER TABLE "racks" ADD CONSTRAINT "racks_localidade_id_fkey" FOREIGN KEY ("localidade_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

DO $$
DECLARE
    sao_gabriel_id UUID;
BEGIN
    SELECT "id" INTO sao_gabriel_id FROM "localidades" WHERE "nome" = 'IEC - São Gabriel';

    UPDATE "colaboradores" SET "localidade_id" = sao_gabriel_id WHERE "localidade_id" IS NULL;
    UPDATE "maquinas" SET "localidade_id" = sao_gabriel_id WHERE "localidade_id" IS NULL;
    UPDATE "notebooks" SET "localidade_id" = sao_gabriel_id WHERE "localidade_id" IS NULL;
    UPDATE "aparelhos" SET "localidade_id" = sao_gabriel_id WHERE "localidade_id" IS NULL;
    UPDATE "impressoras" SET "localidade_id" = sao_gabriel_id WHERE "localidade_id" IS NULL;
    UPDATE "ramais" SET "localidade_id" = sao_gabriel_id WHERE "localidade_id" IS NULL;
    UPDATE "racks" SET "localidade_id" = sao_gabriel_id WHERE "localidade_id" IS NULL;
END $$;

DO $$
DECLARE
    setor_localidade_ids UUID[];
BEGIN
    SELECT array_agg("id") INTO setor_localidade_ids
    FROM "setores"
    WHERE lower("nome") IN (
        'iec - são gabriel',
        'iec - sao gabriel',
        'iec - lourdes',
        'iec - coreu',
        'iec - betim',
        'iec - barreiro',
        'iec - contagem',
        'iec contagem'
    );

    UPDATE "colaboradores"
    SET "setor_id" = NULL,
        "setor" = NULL
    WHERE "setor_id" = ANY(setor_localidade_ids)
       OR lower(coalesce("setor", '')) IN (
            'iec - são gabriel',
            'iec - sao gabriel',
            'iec - lourdes',
            'iec - coreu',
            'iec - betim',
            'iec - barreiro',
            'iec - contagem',
            'iec contagem'
       );

    UPDATE "maquinas"
    SET "setor_id" = NULL,
        "setor" = NULL
    WHERE "setor_id" = ANY(setor_localidade_ids)
       OR lower(coalesce("setor", '')) IN (
            'iec - são gabriel',
            'iec - sao gabriel',
            'iec - lourdes',
            'iec - coreu',
            'iec - betim',
            'iec - barreiro',
            'iec - contagem',
            'iec contagem'
       );

    UPDATE "notebooks"
    SET "setor_id" = NULL,
        "setor" = NULL,
        "emprestado_setor_id" = CASE
            WHEN "emprestado_setor_id" = ANY(setor_localidade_ids) THEN NULL
            ELSE "emprestado_setor_id"
        END
    WHERE "setor_id" = ANY(setor_localidade_ids)
       OR "emprestado_setor_id" = ANY(setor_localidade_ids)
       OR lower(coalesce("setor", '')) IN (
            'iec - são gabriel',
            'iec - sao gabriel',
            'iec - lourdes',
            'iec - coreu',
            'iec - betim',
            'iec - barreiro',
            'iec - contagem',
            'iec contagem'
       );

    UPDATE "aparelhos"
    SET "setor_id" = NULL,
        "setor" = NULL
    WHERE "setor_id" = ANY(setor_localidade_ids)
       OR lower(coalesce("setor", '')) IN (
            'iec - são gabriel',
            'iec - sao gabriel',
            'iec - lourdes',
            'iec - coreu',
            'iec - betim',
            'iec - barreiro',
            'iec - contagem',
            'iec contagem'
       );

    UPDATE "impressoras"
    SET "setor_id" = NULL
    WHERE "setor_id" = ANY(setor_localidade_ids);

    UPDATE "ramais"
    SET "setor_id" = NULL,
        "nome_setor" = NULL
    WHERE "setor_id" = ANY(setor_localidade_ids)
       OR lower(coalesce("nome_setor", '')) IN (
            'iec - são gabriel',
            'iec - sao gabriel',
            'iec - lourdes',
            'iec - coreu',
            'iec - betim',
            'iec - barreiro',
            'iec - contagem',
            'iec contagem'
       );

    UPDATE "racks"
    SET "setor_id" = NULL
    WHERE "setor_id" = ANY(setor_localidade_ids);
END $$;

DELETE FROM "setores"
WHERE lower("nome") IN (
    'iec - são gabriel',
    'iec - sao gabriel',
    'iec - lourdes',
    'iec - coreu',
    'iec - betim',
    'iec - barreiro',
    'iec - contagem',
    'iec contagem',
    'rh',
    'máquinas backups',
    'maquinas backups',
    'máquinas - backup',
    'maquinas - backup'
);
