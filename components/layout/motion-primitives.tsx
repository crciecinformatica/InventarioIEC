'use client'

import { forwardRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type MotionShellProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

type CloseableMotionShellProps = MotionShellProps & {
  onClose: () => void
  zClassName?: string
}

const ease = [0.22, 1, 0.36, 1] as const

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion() || process.env.NODE_ENV === 'test'

  if (reduceMotion) return <>{children}</>

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function AnimatedSheetFrame({
  children,
  className,
  onClose,
  zClassName = 'z-50',
}: CloseableMotionShellProps) {
  const reduceMotion = useReducedMotion()
  const disableMotion = reduceMotion || process.env.NODE_ENV === 'test'
  const sheetInitial = disableMotion ? false : { x: 'calc(100% + 32px)', opacity: 0.96 }
  const sheetExit = disableMotion ? { opacity: 0 } : { x: 'calc(100% + 32px)', opacity: 0.92 }

  return (
    <motion.div
      className={cn('fixed inset-0', zClassName)}
      initial={disableMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease }}
    >
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        initial={disableMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease }}
      />
      <motion.aside
        className={cn('fixed bottom-0 right-0 top-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden', className)}
        data-animated-sheet-frame
        initial={sheetInitial}
        animate={{ x: 0, opacity: 1 }}
        exit={sheetExit}
        style={{ willChange: 'transform' }}
        transition={{ type: 'spring', stiffness: 420, damping: 44, mass: 0.95 }}
      >
        {children}
      </motion.aside>
    </motion.div>
  )
}

export function AnimatedDialogFrame({
  children,
  className,
  onClose,
  zClassName = 'z-50',
}: CloseableMotionShellProps) {
  const reduceMotion = useReducedMotion()
  const disableMotion = reduceMotion || process.env.NODE_ENV === 'test'
  const dialogInitial = disableMotion ? false : { y: 10, scale: 0.9, opacity: 0 }
  const dialogExit = disableMotion ? { opacity: 0 } : { y: 8, scale: 0.92, opacity: 0 }

  return (
    <motion.div
      className={cn('fixed inset-0 flex items-center justify-center p-4', zClassName)}
      initial={disableMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, ease }}
    >
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        initial={disableMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease }}
      />
      <motion.div
        className={cn('relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden', className)}
        initial={dialogInitial}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={dialogExit}
        transition={{ type: 'spring', stiffness: 540, damping: 30, mass: 0.75 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export const AnimatedFloat = forwardRef<HTMLDivElement, MotionShellProps>(function AnimatedFloat(
  { children, className, style },
  ref,
) {
  const reduceMotion = useReducedMotion()
  const disableMotion = reduceMotion || process.env.NODE_ENV === 'test'
  const initial = disableMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 24, scale: 0.9 }
  const exit = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 18, scale: 0.94 }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={initial}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={exit}
      transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.85 }}
    >
      {children}
    </motion.div>
  )
})
