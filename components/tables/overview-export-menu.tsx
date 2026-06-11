'use client'

import { useState } from 'react'
import { ChevronDown, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
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
  return value
}

function buildExportRows<T>(config: OverviewExportConfig<T>) {
  return config.rows.map(row => {
    return config.columns.reduce<OverviewPdfRow>((record, column) => {
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
      const rows = buildExportRows(config)
      const sheet = XLSX.utils.json_to_sheet(rows, {
        header: config.columns.map(column => column.key),
      })

      XLSX.utils.sheet_add_aoa(sheet, [config.columns.map(column => column.header)], { origin: 'A1' })
      sheet['!cols'] = config.columns.map(column => ({
        wch: Math.max(14, Math.min(36, column.header.length + 8)),
      }))
      sheet['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: Math.max(0, config.columns.length - 1), r: Math.max(0, rows.length) },
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
      const rows = buildExportRows(config)
      const columns: OverviewPdfColumn[] = config.columns.map(column => ({
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
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        Extrair
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={exportXlsx}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            XLSX formatado
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <FileDown className="h-4 w-4 text-red-500" />
            PDF
          </button>
        </div>
      )}
    </div>
  )
}
