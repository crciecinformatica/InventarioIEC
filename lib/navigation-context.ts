export type InspectResourceType =
  | 'colaborador'
  | 'maquina'
  | 'notebook'
  | 'aparelho'
  | 'ramal'
  | 'impressora'
  | 'rack'
  | 'movimentacao'
  | 'usuario'

export type InspectContext = {
  path: string
  inspectId: string
  type: InspectResourceType
  label: string
  title: string
  subtitle?: string
  href: string
  timestamp: number
}

export const INSPECT_CONTEXT_STORAGE_KEY = 'crc:last-inspect-context'
export const INSPECT_CONTEXT_STACK_STORAGE_KEY = 'crc:inspect-context-stack'
export const PENDING_INSPECT_PREVIEWS_STORAGE_KEY = 'crc:pending-inspect-previews'
export const MAX_INSPECT_CONTEXTS = 8

const RESOURCE_BY_PATH: Record<string, { type: InspectResourceType; label: string }> = {
  '/colaboradores': { type: 'colaborador', label: 'Colaborador' },
  '/maquinas': { type: 'maquina', label: 'Máquina' },
  '/notebooks': { type: 'notebook', label: 'Notebook' },
  '/aparelhos': { type: 'aparelho', label: 'Aparelho' },
  '/ramais': { type: 'ramal', label: 'Ramal' },
  '/impressoras': { type: 'impressora', label: 'Impressora' },
  '/racks': { type: 'rack', label: 'Rack' },
  '/movimentacoes': { type: 'movimentacao', label: 'Auditoria' },
  '/usuarios': { type: 'usuario', label: 'Usuário' },
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

export type InspectPreview = {
  title?: string
  subtitle?: string
}

export function createInspectContext(
  path: string,
  currentSearch: string,
  now = Date.now(),
  preview?: InspectPreview | null
): InspectContext | null {
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
    title: preview?.title?.trim() || resource.label,
    subtitle: preview?.subtitle?.trim() || undefined,
    href: buildHref(path, params),
    timestamp: now,
  }
}

export function getReturnContextForRoute(current: InspectContext | null, stored: InspectContext | null) {
  if (current && stored && stored.href !== current.href) return stored
  return current ?? stored
}

export function updateInspectHistory(
  history: InspectContext[],
  current: InspectContext,
  maxItems = MAX_INSPECT_CONTEXTS
) {
  const withoutCurrent = history.filter(item => item.href !== current.href)
  return [current, ...withoutCurrent].slice(0, maxItems)
}

export function getReturnOptions(history: InspectContext[], currentHref: string) {
  return history.filter(item => item.href !== currentHref)
}

export function isStoredInspectContext(value: unknown): value is InspectContext {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<InspectContext>

  return (
    typeof candidate.path === 'string' &&
    typeof candidate.inspectId === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.href === 'string' &&
    typeof candidate.timestamp === 'number'
  )
}

function normalizeInspectContext(value: unknown): InspectContext | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<InspectContext>

  if (
    typeof candidate.path !== 'string' ||
    typeof candidate.inspectId !== 'string' ||
    typeof candidate.type !== 'string' ||
    typeof candidate.label !== 'string' ||
    typeof candidate.href !== 'string' ||
    typeof candidate.timestamp !== 'number'
  ) {
    return null
  }

  return {
    path: candidate.path,
    inspectId: candidate.inspectId,
    type: candidate.type as InspectResourceType,
    label: candidate.label,
    title: typeof candidate.title === 'string' ? candidate.title : candidate.label,
    subtitle: typeof candidate.subtitle === 'string' ? candidate.subtitle : undefined,
    href: candidate.href,
    timestamp: candidate.timestamp,
  }
}

export function readInspectContext(storage: Storage): InspectContext | null {
  try {
    const raw = storage.getItem(INSPECT_CONTEXT_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return normalizeInspectContext(parsed)
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

export function readInspectHistory(storage: Storage): InspectContext[] {
  try {
    const raw = storage.getItem(INSPECT_CONTEXT_STACK_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeInspectContext)
          .filter((item): item is InspectContext => Boolean(item))
      }
    }
  } catch {
    return []
  }

  const legacy = readInspectContext(storage)
  return legacy ? [legacy] : []
}

export function writeInspectHistory(storage: Storage, history: InspectContext[]) {
  storage.setItem(INSPECT_CONTEXT_STACK_STORAGE_KEY, JSON.stringify(history.slice(0, MAX_INSPECT_CONTEXTS)))
  if (history[0]) writeInspectContext(storage, history[0])
}

export function clearInspectHistory(storage: Storage) {
  storage.removeItem(INSPECT_CONTEXT_STACK_STORAGE_KEY)
  storage.removeItem(INSPECT_CONTEXT_STORAGE_KEY)
}

function readPendingPreviews(storage: Storage): Record<string, InspectPreview> {
  try {
    const raw = storage.getItem(PENDING_INSPECT_PREVIEWS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, InspectPreview>
      : {}
  } catch {
    return {}
  }
}

export function writePendingInspectPreview(storage: Storage, href: string, preview: InspectPreview) {
  const previews = readPendingPreviews(storage)
  previews[href] = preview
  storage.setItem(PENDING_INSPECT_PREVIEWS_STORAGE_KEY, JSON.stringify(previews))
}

export function consumePendingInspectPreview(storage: Storage, href: string) {
  const previews = readPendingPreviews(storage)
  const preview = previews[href] ?? null
  if (!preview) return null

  delete previews[href]
  storage.setItem(PENDING_INSPECT_PREVIEWS_STORAGE_KEY, JSON.stringify(previews))
  return preview
}

export function getInspectPreviewFromContext(context: InspectContext): InspectPreview {
  return {
    title: context.title,
    subtitle: context.subtitle,
  }
}

function stringField(item: Record<string, unknown>, key: string) {
  const value = item[key]
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function numberField(item: Record<string, unknown>, key: string) {
  const value = item[key]
  return typeof value === 'number' ? String(value) : ''
}

export function inferInspectPreview(item: Record<string, unknown>, fallback = 'Registro'): InspectPreview {
  const title =
    stringField(item, 'nome') ||
    stringField(item, 'nome_host') ||
    stringField(item, 'modelo') ||
    stringField(item, 'numero_patrimonio') ||
    stringField(item, 'numero_ramal') ||
    stringField(item, 'nome_switch') ||
    stringField(item, 'identificador') ||
    stringField(item, 'descricao') ||
    numberField(item, 'codigo') ||
    fallback

  const hardware = [stringField(item, 'fabricante'), stringField(item, 'modelo')].filter(Boolean).join(' ')
  const subtitle =
    stringField(item, 'setor_nome') ||
    stringField(item, 'localidade_nome') ||
    stringField(item, 'endereco_ip') ||
    stringField(item, 'email') ||
    hardware ||
    undefined

  return { title, subtitle }
}
