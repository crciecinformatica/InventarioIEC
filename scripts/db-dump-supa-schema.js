/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')
const { getDatabaseUrl, normalizePostgresCliUrl, run } = require('./db-utils')

const snapshotsDir = path.join(process.cwd(), 'supabase', 'schema-snapshots')
fs.mkdirSync(snapshotsDir, { recursive: true })

const now = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\..+$/, '')
  .replace('T', '')

const outFile = path.join(snapshotsDir, `${now}_supa_current_schema.sql`)

run('pg_dump', [
  '--schema-only',
  '--no-owner',
  '--no-privileges',
  '--exclude-schema=auth',
  '--exclude-schema=storage',
  '--exclude-schema=extensions',
  '--exclude-schema=realtime',
  '--exclude-schema=supabase_functions',
  '--exclude-schema=supabase_migrations',
  '--exclude-schema=vault',
  '--file',
  outFile,
  normalizePostgresCliUrl(getDatabaseUrl()),
])

console.log(`Wrote ${path.relative(process.cwd(), outFile)}`)
