/* eslint-disable @typescript-eslint/no-require-imports */

const { spawnSync } = require('child_process')
const { getDatabaseUrl } = require('./db-utils')

const result = spawnSync('npx', [
  'prisma',
  'migrate',
  'diff',
  '--from-url',
  getDatabaseUrl({ local: true }),
  '--to-schema-datamodel',
  'prisma/schema.prisma',
  '--script',
], { encoding: 'utf8' })

if (result.status !== 0) {
  process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}

const output = result.stdout.trim()

if (output && output !== '-- This is an empty migration.') {
  process.stdout.write(`${result.stdout.trim()}\n`)
}
