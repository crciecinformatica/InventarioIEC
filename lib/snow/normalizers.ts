import type { TipoRelatorioSnow } from './types'

const TYPE_PATTERNS: Array<{ tipo: TipoRelatorioSnow; patterns: RegExp[] }> = [
  {
    tipo: 'ativos_nao_inventariados',
    patterns: [/ativos?.*descobertos?.*nao.*inventariados?/, /nao.*inventariados?/],
  },
  {
    tipo: 'computadores_fora_organizacao',
    patterns: [/computadores?.*fora.*organizacao/, /fora.*organizacao/],
  },
  {
    tipo: 'computadores_a_serem_arquivados',
    patterns: [/computadores?.*serem.*arquivados?/, /a serem arquivados?/, /serem arquivados?/],
  },
]

export function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function normalizeHeader(value: unknown) {
  return normalizeText(value).replace(/\s+/g, '_')
}

export function normalizeIp(value: unknown) {
  const raw = String(value ?? '').trim()
  const match = raw.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)
  if (!match) return null

  const parts = match[0].split('.').map(Number)
  if (parts.some(part => Number.isNaN(part) || part < 0 || part > 255)) return null
  return parts.join('.')
}

export function normalizeHostname(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  const hostname = raw
    .split('.')[0]
    .replace(/[^A-Za-z0-9_-]/g, '')
    .toUpperCase()

  return hostname || null
}

export function parseOptionalDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

export function identifySnowReportType(...sources: Array<unknown>): TipoRelatorioSnow | null {
  for (const source of sources) {
    const haystack = normalizeText(source)
    if (!haystack) continue

    for (const candidate of TYPE_PATTERNS) {
      if (candidate.patterns.some(pattern => pattern.test(haystack))) return candidate.tipo
    }
  }

  return null
}

export function toPrismaDate(value: Date | string | null) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const normalized = value.length === 10 ? `${value}T00:00:00.000Z` : value
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateOnly(value: Date | string | null) {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}
