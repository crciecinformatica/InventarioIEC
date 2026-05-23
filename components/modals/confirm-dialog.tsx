'use client'

import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { AnimatedDialogFrame } from '@/components/layout/motion-primitives'

interface ConfirmDialogProps {
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({ title, description, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  const [open, setOpen] = useState(true)

  function handleCancel() {
    if (loading) return
    setOpen(false)
  }

  return (
    <AnimatePresence onExitComplete={onCancel}>
      {open && (
        <AnimatedDialogFrame onClose={handleCancel} zClassName="z-[60]" className="max-w-sm rounded-xl border border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 ml-13">{description}</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Excluir
            </button>
          </div>
        </AnimatedDialogFrame>
      )}
    </AnimatePresence>
  )
}
