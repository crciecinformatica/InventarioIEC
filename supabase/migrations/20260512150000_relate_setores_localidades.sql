ALTER TABLE "setores" ADD COLUMN IF NOT EXISTS "localidade_id" UUID;

CREATE INDEX IF NOT EXISTS "idx_setores_localidade_id" ON "setores"("localidade_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'setores_localidade_id_fkey') THEN
        ALTER TABLE "setores" ADD CONSTRAINT "setores_localidade_id_fkey" FOREIGN KEY ("localidade_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

DO $$
DECLARE
    sao_gabriel_id UUID;
    contratos_id UUID;
    rh_contratos_id UUID;
BEGIN
    SELECT "id" INTO sao_gabriel_id FROM "localidades" WHERE "nome" = 'IEC - São Gabriel';

    UPDATE "setores"
    SET "localidade_id" = sao_gabriel_id
    WHERE "localidade_id" IS NULL;

    SELECT "id" INTO contratos_id FROM "setores" WHERE lower("nome") = 'contratos';
    SELECT "id" INTO rh_contratos_id
    FROM "setores"
    WHERE lower(regexp_replace("nome", '\s+', '', 'g')) = 'rh/contratos';

    IF rh_contratos_id IS NOT NULL AND contratos_id IS NULL THEN
        UPDATE "setores"
        SET "nome" = 'Contratos',
            "localidade_id" = sao_gabriel_id,
            "ativo" = true
        WHERE "id" = rh_contratos_id;
    ELSIF rh_contratos_id IS NOT NULL AND contratos_id IS NOT NULL THEN
        UPDATE "colaboradores" SET "setor_id" = contratos_id WHERE "setor_id" = rh_contratos_id;
        UPDATE "maquinas" SET "setor_id" = contratos_id WHERE "setor_id" = rh_contratos_id;
        UPDATE "notebooks" SET "setor_id" = contratos_id WHERE "setor_id" = rh_contratos_id;
        UPDATE "notebooks" SET "emprestado_setor_id" = contratos_id WHERE "emprestado_setor_id" = rh_contratos_id;
        UPDATE "aparelhos" SET "setor_id" = contratos_id WHERE "setor_id" = rh_contratos_id;
        UPDATE "impressoras" SET "setor_id" = contratos_id WHERE "setor_id" = rh_contratos_id;
        UPDATE "ramais" SET "setor_id" = contratos_id WHERE "setor_id" = rh_contratos_id;
        UPDATE "racks" SET "setor_id" = contratos_id WHERE "setor_id" = rh_contratos_id;

        DELETE FROM "setores" WHERE "id" = rh_contratos_id;

        UPDATE "setores"
        SET "localidade_id" = sao_gabriel_id,
            "ativo" = true
        WHERE "id" = contratos_id;
    END IF;

    IF EXISTS (SELECT 1 FROM "setores" WHERE lower("nome") = 'rh') THEN
        UPDATE "setores"
        SET "ativo" = true,
            "localidade_id" = COALESCE("localidade_id", sao_gabriel_id)
        WHERE lower("nome") = 'rh';
    ELSE
        INSERT INTO "setores" ("nome", "descricao", "ativo", "localidade_id")
        VALUES ('RH', NULL, true, sao_gabriel_id);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "setores_nome_key" ON "setores"("nome");
