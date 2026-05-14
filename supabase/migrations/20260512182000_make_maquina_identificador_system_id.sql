-- Machine identifier is now a system-owned value equal to the row UUID.
-- User-facing forms must not write this column manually.

UPDATE "maquinas"
SET "identificador" = "id"::text
WHERE "identificador" IS DISTINCT FROM "id"::text;
