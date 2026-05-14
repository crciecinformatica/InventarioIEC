/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')
const { getDatabaseUrl, run } = require('./db-utils')

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
const databaseUrl = getDatabaseUrl({ local: true })

const migrations = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

for (const migration of migrations) {
  const filePath = path.join(migrationsDir, migration)
  console.log(`Applying ${migration} to local database...`)
  run('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', filePath])
}

console.log(`Applied ${migrations.length} migration(s) to local database.`)
