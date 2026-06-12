'use client'

import { useState } from 'react'
import { ChevronDown, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import type { OverviewPdfColumn, OverviewPdfRow } from '@/components/tables/overview-export-pdf'

export type OverviewExportColumn<T> = {
  header: string
  key: string
  value: (row: T) => string | number | boolean | null | undefined
}

export type OverviewExportConfig<T> = {
  title: string
  rows: T[]
  columns: OverviewExportColumn<T>[]
  xlsxColumns?: OverviewExportColumn<T>[]
  pdfColumns?: OverviewExportColumn<T>[]
  activeFilters?: Array<{ kind: string; label?: string; value?: string }>
  filename?: string
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatCell(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao'
  if (typeof value === 'string' && isGuid(value)) return ''
  return value
}

function isGuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
}

function isInternalColumn(column: OverviewExportColumn<unknown>) {
  const key = column.key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const header = column.header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (key === 'id' || key.endsWith('_id') || key.endsWith('-id')) return true
  if (key.includes('guid') || key.includes('uuid')) return true
  if (header === 'id' || header.includes('guid') || header.includes('uuid')) return true
  return false
}

function isGuidOnlyColumn<T>(config: OverviewExportConfig<T>, column: OverviewExportColumn<T>) {
  const values = config.rows
    .map(row => column.value(row))
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')

  return values.length > 0 && values.every(isGuid)
}

function getExportColumns<T>(config: OverviewExportConfig<T>, format: 'xlsx' | 'pdf') {
  const columns = format === 'xlsx'
    ? config.xlsxColumns ?? config.columns
    : config.pdfColumns ?? config.columns

  return columns.filter(column => !isInternalColumn(column as OverviewExportColumn<unknown>) && !isGuidOnlyColumn(config, column))
}

function buildExportRows<T>(config: OverviewExportConfig<T>, columns: OverviewExportColumn<T>[]) {
  return config.rows.map(row => {
    return columns.reduce<OverviewPdfRow>((record, column) => {
      record[column.key] = formatCell(column.value(row))
      return record
    }, {})
  })
}

function getFilterLabels(filters?: OverviewExportConfig<unknown>['activeFilters']) {
  return (filters ?? [])
    .filter(filter => filter.kind !== 'all')
    .map(filter => filter.label ?? filter.value ?? filter.kind)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function OverviewExportMenu<T>({ config }: { config: OverviewExportConfig<T> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<'xlsx' | 'pdf' | null>(null)
  const baseFilename = config.filename ?? slugify(config.title)
  const stamp = new Date().toISOString().slice(0, 10)

  async function exportXlsx() {
    setLoading('xlsx')
    setOpen(false)
    try {
      const XLSX = await import('xlsx')
      const columns = getExportColumns(config, 'xlsx')
      const rows = buildExportRows(config, columns)
      const sheet = XLSX.utils.json_to_sheet(rows, {
        header: columns.map(column => column.key),
      })

      XLSX.utils.sheet_add_aoa(sheet, [columns.map(column => column.header)], { origin: 'A1' })
      sheet['!cols'] = columns.map(column => ({
        wch: Math.max(14, Math.min(36, column.header.length + 8)),
      }))
      sheet['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: Math.max(0, columns.length - 1), r: Math.max(0, rows.length) },
        }),
      }

      const workbook = XLSX.utils.book_new()
      workbook.Props = {
        Title: config.title,
        Subject: `Overview filtrado - ${getFilterLabels(config.activeFilters).join(', ') || 'Visao geral'}`,
        CreatedDate: new Date(),
      }
      XLSX.utils.book_append_sheet(workbook, sheet, 'Overview')
      XLSX.writeFile(workbook, `${baseFilename}-${stamp}.xlsx`, { compression: true })
      toast.success('XLSX do overview gerado.')
    } catch (error) {
      console.error('[OverviewExport xlsx]', error)
      toast.error('Nao foi possivel gerar o XLSX.')
    } finally {
      setLoading(null)
    }
  }

  async function exportPdf() {
    setLoading('pdf')
    setOpen(false)
    try {
      const [{ pdf }, { OverviewExportPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/tables/overview-export-pdf'),
      ])
      const exportColumns = getExportColumns(config, 'pdf')
      const rows = buildExportRows(config, exportColumns)
      const columns: OverviewPdfColumn[] = exportColumns.map(column => ({
        key: column.key,
        header: column.header,
      }))
      const blob = await pdf(
        <OverviewExportPDF
          title={config.title}
          rows={rows}
          columns={columns}
          filters={getFilterLabels(config.activeFilters)}
        />
      ).toBlob()

      downloadBlob(blob, `${baseFilename}-${stamp}.pdf`)
      toast.success('PDF do overview gerado.')
    } catch (error) {
      console.error('[OverviewExport pdf]', error)
      toast.error('Nao foi possivel gerar o PDF.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        disabled={loading !== null}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        Extrair
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30"
        >
          <button
            type="button"
            onClick={exportXlsx}
            className="flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">XLSX formatado</span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500 dark:text-slate-400">Relação completa dos ativos.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="flex w-full items-start gap-3 border-t border-slate-100 px-3 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <FileDown className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">PDF</span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500 dark:text-slate-400">Síntese curta das tabelas inspecionadas.</span>
            </span>
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
