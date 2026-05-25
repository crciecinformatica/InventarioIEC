'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  buildInspectHref,
  inferInspectPreview,
  removeInspectHref,
  writePendingInspectPreview,
} from '@/lib/navigation-context'

type InspectableItem = {
  id: string
}

export function useInspectNavigation<T extends InspectableItem>(
  setSelected: (item: T | null) => void
) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function openInspect(item: T) {
    const href = buildInspectHref(pathname, searchParams.toString(), item.id)
    setSelected(item)
    writePendingInspectPreview(window.sessionStorage, href, inferInspectPreview(item as Record<string, unknown>))
    router.push(href, { scroll: false })
  }

  function closeInspect() {
    setSelected(null)
    if (!searchParams.has('inspect')) return

    router.replace(removeInspectHref(pathname, searchParams.toString()), { scroll: false })
  }

  return { openInspect, closeInspect }
}
