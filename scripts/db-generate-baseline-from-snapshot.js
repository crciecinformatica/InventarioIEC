/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const snapshotsDir = path.join(process.cwd(), 'supabase', 'schema-snapshots')
const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

const snapshot = fs
  .readdirSync(snapshotsDir)
  .filter((file) => file.endsWith('_supa_current_schema.prisma'))
  .sort()
  .at(-1)

if (!snapshot) {
  console.error('No Supabase schema snapshot found.')
  process.exit(1)
}

const outFile = path.join(migrationsDir, '20260512090000_baseline_supa_current_schema.sql')
const result = spawnSync('npx', [
  'prisma',
  'migrate',
  'diff',
  '--from-empty',
  '--to-schema-datamodel',
  path.join(snapshotsDir, snapshot),
  '--script',
], { encoding: 'utf8' })

if (result.status !== 0) {
  process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}

const header = [
  '-- Baseline generated from the current Supabase production schema.',
  `-- Source snapshot: supabase/schema-snapshots/${snapshot}`,
  '-- This migration is intended for fresh local/CI databases only.',
  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
  '',
].join('\n')

fs.writeFileSync(outFile, header + result.stdout)
console.log(`Wrote ${path.relative(process.cwd(), outFile)}`)
