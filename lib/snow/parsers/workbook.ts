import * as XLSX from 'xlsx'
import { identifySnowReportType, normalizeHeader, normalizeHostname, normalizeIp } from '../normalizers'
import { SnowProcessingError, type SnowMetadata, type SnowParsedItem, type TipoRelatorioSnow } from '../types'

const IP_ALIASES = new Set([
  'ip',
  'endereco_ip',
  'endereco_de_ip',
  'address',
  'ip_address',
])

const HOSTNAME_ALIASES = new Set([
  'hostname',
  'host',
  'nome_host',
  'nome_do_host',
  'computer',
  'computer_name',
  'nome_do_computador',
  'computador',
  'maquina',
])

function firstWorksheetRows(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new SnowProcessingError('Planilha vazia')

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  })

  return { sheetName, rows }
}

function findColumn(headers: string[], aliases: Set<string>) {
  return headers.find(header => aliases.has(header)) ?? null
}

function summarizeRows(rows: Record<string, unknown>[]) {
  return rows
    .slice(0, 5)
    .flatMap(row => Object.entries(row).flatMap(([key, value]) => [key, value]))
    .join(' ')
}

export function parseSnowWorkbook(buffer: Buffer, metadata: SnowMetadata): {
  tipoRelatorio: TipoRelatorioSnow
  itens: SnowParsedItem[]
} {
  const { sheetName, rows } = firstWorksheetRows(buffer)
  if (rows.length === 0) throw new SnowProcessingError('Planilha vazia')

  const tipoRelatorio = identifySnowReportType(
    metadata.nomeArquivo,
    metadata.assuntoEmail,
    sheetName,
    summarizeRows(rows)
  )

  if (!tipoRelatorio) {
    throw new SnowProcessingError('Tipo de relatório SNOW não identificado')
  }

  const originalHeaders = Object.keys(rows[0] ?? {})
  const normalizedHeaders = new Map(originalHeaders.map(header => [normalizeHeader(header), header]))
  const ipHeader = findColumn(Array.from(normalizedHeaders.keys()), IP_ALIASES)
  const hostnameHeader = findColumn(Array.from(normalizedHeaders.keys()), HOSTNAME_ALIASES)

  if (!ipHeader && !hostnameHeader) {
    throw new SnowProcessingError('Layout inesperado: nenhuma coluna de IP ou hostname encontrada')
  }

  const ipColumn = ipHeader ? normalizedHeaders.get(ipHeader) ?? null : null
  const hostnameColumn = hostnameHeader ? normalizedHeaders.get(hostnameHeader) ?? null : null

  const itens = rows
    .map(row => ({
      ip: ipColumn ? normalizeIp(row[ipColumn]) : null,
      hostname: hostnameColumn ? normalizeHostname(row[hostnameColumn]) : null,
      raw: row,
    }))
    .filter(item => item.ip || item.hostname)

  if (itens.length === 0) {
    throw new SnowProcessingError('Nenhum item com IP ou hostname válido foi encontrado')
  }

  return { tipoRelatorio, itens }
}
