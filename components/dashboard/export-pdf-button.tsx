'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ExportPdfButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      // Buscar dados
      const res = await fetch('/api/dashboard/pdf-data')
      if (!res.ok) throw new Error('Erro ao buscar dados')
      const data = await res.json()

      // Importar dinamicamente para não aumentar o bundle inicial
      const [{ pdf }, { DashboardPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/dashboard/dashboard-pdf'),
      ])

      // Gerar blob do PDF
      const blob = await pdf(<DashboardPDF data={data} />).toBlob()

      // Download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dataStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
      a.href = url
      a.download = `inventario-iec-${dataStr}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('PDF gerado com sucesso!')
    } catch (err) {
      console.error('[ExportPdf]', err)
      toast.error('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition bg-white dark:bg-slate-900"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <FileDown className="w-4 h-4" />
      }
      {loading ? 'Gerando PDF...' : 'Extrair Dashboard PDF'}
    </button>
  )
}