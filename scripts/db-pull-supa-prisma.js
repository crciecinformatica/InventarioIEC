/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { getDatabaseUrl } = require('./db-utils')

const snapshotsDir = path.join(process.cwd(), 'supabase', 'schema-snapshots')
fs.mkdirSync(snapshotsDir, { recursive: true })

const now = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\..+$/, '')
  .replace('T', '')

const outFile = path.join(snapshotsDir, `${now}_supa_current_schema.prisma`)

const result = spawnSync('npx', ['prisma', 'db', 'pull', '--print'], {
  encoding: 'utf8',
  env: {
    ...process.env,
    DATABASE_URL: getDatabaseUrl(),
  },
})

if (result.status !== 0) {
  process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}

fs.writeFileSync(outFile, result.stdout)
process.stdout.write(`Wrote ${path.relative(process.cwd(), outFile)}\n`)
