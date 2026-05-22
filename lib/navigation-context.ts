export type InspectResourceType =
  | 'colaborador'
  | 'maquina'
  | 'notebook'
  | 'aparelho'
  | 'ramal'
  | 'impressora'
  | 'rack'
  | 'movimentacao'

export type InspectContext = {
  path: string
  inspectId: string
  type: InspectResourceType
  label: string
  href: string
  timestamp: number
}

export const INSPECT_CONTEXT_STORAGE_KEY = 'crc:last-inspect-context'

const RESOURCE_BY_PATH: Record<string, { type: InspectResourceType; label: string }> = {
  '/colaboradores': { type: 'colaborador', label: 'Colaborador' },
  '/maquinas': { type: 'maquina', label: 'Máquina' },
  '/notebooks': { type: 'notebook', label: 'Notebook' },
  '/aparelhos': { type: 'aparelho', label: 'Aparelho' },
  '/ramais': { type: 'ramal', label: 'Ramal' },
  '/impressoras': { type: 'impressora', label: 'Impressora' },
  '/racks': { type: 'rack', label: 'Rack' },
  '/movimentacoes': { type: 'movimentacao', label: 'Auditoria' },
}

export function buildHref(path: string, params: URLSearchParams) {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export function buildInspectHref(path: string, currentSearch: string, inspectId: string) {
  const params = new URLSearchParams(currentSearch)
  params.set('inspect', inspectId)
  return buildHref(path, params)
}

export function removeInspectHref(path: string, currentSearch: string) {
  const params = new URLSearchParams(currentSearch)
  params.delete('inspect')
  return buildHref(path, params)
}

export function getInspectableResource(path: string) {
  return RESOURCE_BY_PATH[path] ?? null
}

export function createInspectContext(path: string, currentSearch: string, now = Date.now()): InspectContext | null {
  const resource = getInspectableResource(path)
  if (!resource) return null

  const params = new URLSearchParams(currentSearch)
  const inspectId = params.get('inspect')
  if (!inspectId) return null

  return {
    path,
    inspectId,
    type: resource.type,
    label: resource.label,
    href: buildHref(path, params),
    timestamp: now,
  }
}

export function getReturnContextForRoute(
  current: InspectContext | null,
  stored: InspectContext | null
) {
  if (current && stored && stored.href !== current.href) return stored
  return current ?? stored
}

export function isStoredInspectContext(value: unknown): value is InspectContext {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<InspectContext>

  return (
    typeof candidate.path === 'string' &&
    typeof candidate.inspectId === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.href === 'string' &&
    typeof candidate.timestamp === 'number'
  )
}

export function readInspectContext(storage: Storage): InspectContext | null {
  try {
    const raw = storage.getItem(INSPECT_CONTEXT_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return isStoredInspectContext(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeInspectContext(storage: Storage, context: InspectContext) {
  storage.setItem(INSPECT_CONTEXT_STORAGE_KEY, JSON.stringify(context))
}

export function clearInspectContext(storage: Storage) {
  storage.removeItem(INSPECT_CONTEXT_STORAGE_KEY)
}
