/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { getDatabaseUrl, normalizePostgresCliUrl } = require('./db-utils')

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
const databaseUrl = normalizePostgresCliUrl(process.env.DATABASE_URL || getDatabaseUrl())
const startAt = process.env.MIGRATION_START_AT || ''

const migrations = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .filter((file) => !startAt || file >= startAt)
  .sort()

function psql(args, input) {
  const result = spawnSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', ...args], {
    input,
    encoding: 'utf8',
    stdio: input ? ['pipe', 'inherit', 'inherit'] : 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`
}

psql(['-c', `
  CREATE TABLE IF NOT EXISTS public.app_schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`])

for (const migration of migrations) {
  const applied = spawnSync(
    'psql',
    [
      databaseUrl,
      '-tAc',
      `SELECT 1 FROM public.app_schema_migrations WHERE version = ${sqlString(migration)}`,
    ],
    { encoding: 'utf8' },
  )

  if (applied.status !== 0) {
    process.exit(applied.status ?? 1)
  }

  if (applied.stdout.trim() === '1') {
    console.log(`Skipping already applied migration ${migration}`)
    continue
  }

  const filePath = path.join(migrationsDir, migration)
  console.log(`Applying pending migration ${migration}`)
  psql(['-f', filePath])
  psql(['-c', `INSERT INTO public.app_schema_migrations (version) VALUES (${sqlString(migration)})`])
}

console.log(`Checked ${migrations.length} migration(s).`)
