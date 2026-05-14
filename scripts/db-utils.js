/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

function readEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName)
  if (!fs.existsSync(filePath)) return {}

  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return env

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match) return env

      const [, key, rawValue] = match
      env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '')
      return env
    }, {})
}

function getDatabaseUrl({ local = false } = {}) {
  const baseEnv = readEnvFile('.env')
  const localEnv = readEnvFile('.env.local')

  const value = local
    ? process.env.LOCAL_DATABASE_URL || localEnv.LOCAL_DATABASE_URL || localEnv.DATABASE_URL || baseEnv.LOCAL_DATABASE_URL
    : process.env.DATABASE_URL || baseEnv.DATABASE_URL

  if (!value) {
    const key = local ? 'LOCAL_DATABASE_URL' : 'DATABASE_URL'
    throw new Error(`${key} is not configured`)
  }

  return value
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    ...options,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function normalizePostgresCliUrl(databaseUrl) {
  const url = new URL(databaseUrl)
  url.searchParams.delete('pgbouncer')
  return url.toString()
}

module.exports = {
  getDatabaseUrl,
  normalizePostgresCliUrl,
  run,
}
