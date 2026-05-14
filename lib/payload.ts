const LEGACY_VIRTUAL_FIELDS = [
  'setor',
  'nome_setor',
  'setor_nome',
  'setor_rel',
  'localidade_nome',
  'localidade_rel',
]

export function withoutLegacyVirtualFields<T extends Record<string, unknown>>(payload: T) {
  const data = { ...payload }

  for (const field of LEGACY_VIRTUAL_FIELDS) {
    delete data[field]
  }

  return data
}
