/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

if (!fs.existsSync(migrationsDir)) {
  console.error('Migration directory not found: supabase/migrations')
  process.exit(1)
}

const migrations = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

if (migrations.length === 0) {
  console.error('No SQL migrations found in supabase/migrations')
  process.exit(1)
}

let failed = false
let previous = ''
const seen = new Set()

for (const migration of migrations) {
  const filePath = path.join(migrationsDir, migration)
  const content = fs.readFileSync(filePath, 'utf8')
  const validName = /^\d{14}_[a-z0-9_]+\.sql$/.test(migration)

  if (!validName) {
    console.error(`Invalid migration name: ${migration}`)
    console.error('Expected format: YYYYMMDDHHMMSS_descriptive_name.sql')
    failed = true
  }

  if (seen.has(migration)) {
    console.error(`Duplicate migration name: ${migration}`)
    failed = true
  }

  if (previous && migration <= previous) {
    console.error(`Migration order problem: ${migration} must sort after ${previous}`)
    failed = true
  }

  seen.add(migration)
  previous = migration

  const meaningfulLines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('--'))

  if (meaningfulLines.length === 0) {
    console.error(`Empty migration: ${path.relative(process.cwd(), filePath)}`)
    failed = true
  }

  if (/DROP\s+(TABLE|SCHEMA|DATABASE)\b/i.test(content)) {
    console.error(`Potentially destructive statement found in: ${migration}`)
    console.error('Use an explicit reviewed migration for destructive operations.')
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log(`Validated ${migrations.length} migration file(s).`)
